import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callAI(systemPrompt: string, userPrompt: string, tools?: any[], toolChoice?: any) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const body: any = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 429) return jsonResponse({ error: "Rate limited. Please try again later." }, 429);
    if (response.status === 402) return jsonResponse({ error: "Credits exhausted. Please add funds." }, 402);
    const t = await response.text();
    console.error("AI error:", response.status, t);
    throw new Error("AI gateway error");
  }

  const aiData = await response.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall) return JSON.parse(toolCall.function.arguments);
  return aiData.choices?.[0]?.message?.content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;

    // Parse resume text and extract info
    if (action === "parse_resume") {
      const { resumeText } = body;
      const result = await callAI(
        `You are an expert resume parser. Extract structured information from the resume text accurately. The candidate's full name is usually at the very top of the resume (first 1-3 lines), often in larger text. It is a person's name (2-4 words, capitalized), NOT a job title, email, phone, or section heading like "Resume" or "Curriculum Vitae". Never return generic words as the name.`,
        `Parse this resume and carefully extract the candidate's actual full name from the top of the document:\n\n${resumeText}`,
        [{
          type: "function",
          function: {
            name: "return_resume_data",
            description: "Return parsed resume data",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                role: { type: "string", description: "Primary job role/title" },
                experience: { type: "string", enum: ["fresher", "junior", "mid", "senior"] },
                skills: { type: "array", items: { type: "string" } },
                education: { type: "string" },
                summary: { type: "string", description: "Brief professional summary" },
              },
              required: ["name", "role", "experience", "skills", "education", "summary"],
              additionalProperties: false,
            },
          },
        }],
        { type: "function", function: { name: "return_resume_data" } }
      );
      if (result instanceof Response) return result;
      return jsonResponse(result);
    }

    // Generate questions for a specific round
    if (action === "generate_questions") {
      const { role, experience, skills, roundType, numQuestions, resumeText } = body;

      let systemPrompt = "";
      if (roundType === "resume") {
        systemPrompt = `You are an expert interviewer. Generate exactly ${numQuestions} descriptive interview questions based on the candidate's resume. Questions should probe deep into their experience, projects, and skills mentioned in the resume. Focus on "tell me about", "explain", "describe" style questions.\n\nResume:\n${resumeText}`;
      } else if (roundType === "aptitude") {
        systemPrompt = `You are an expert aptitude test creator. Generate exactly ${numQuestions} multiple-choice aptitude questions for a ${experience}-level ${role}. Mix categories evenly across: "Numerical Ability" (arithmetic, percentages, ratios, time-speed-distance, profit/loss), "Logical Reasoning" (series, analogies, syllogisms, blood relations, coding-decoding), "Verbal Reasoning" (sentence completion, comprehension), and "Data Interpretation". Each question MUST have exactly 4 options labeled implicitly (A, B, C, D), one correct answer, and a clear short explanation. Use the "category" field to indicate which aptitude area it belongs to.`;
      } else if (roundType === "hr") {
        systemPrompt = `You are an expert HR interviewer. Generate exactly ${numQuestions} HR interview questions for a ${experience}-level ${role}. Include behavioral (STAR method), situational, cultural fit, salary negotiation, conflict resolution, and leadership questions.`;
      } else {
        systemPrompt = `You are an expert interviewer. Generate exactly ${numQuestions} technical interview questions for a ${experience}-level ${role}. Skills: ${skills}. Include coding, system design, and technical concepts.`;
      }

      const result = await callAI(
        systemPrompt,
        `Generate ${numQuestions} ${roundType} interview questions for ${role} with skills in ${skills}.`,
        [{
          type: "function",
          function: {
            name: "return_questions",
            description: "Return generated interview questions",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      category: { type: "string" },
                      options: {
                        type: "array",
                        items: { type: "string" },
                        description: "For aptitude MCQs: exactly 4 answer options. Omit or empty for descriptive questions.",
                      },
                      correctAnswer: {
                        type: "string",
                        description: "For aptitude MCQs: the exact text of the correct option. Omit for descriptive questions.",
                      },
                      explanation: {
                        type: "string",
                        description: "For aptitude MCQs: brief explanation of the correct answer.",
                      },
                    },
                    required: ["question", "category"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        }],
        { type: "function", function: { name: "return_questions" } }
      );
      if (result instanceof Response) return result;
      return jsonResponse({ questions: result.questions });
    }

    // Evaluate answer
    if (action === "evaluate_answer") {
      const { question, answer, role, roundType, videoAnalysis } = body;

      let context = "";
      if (videoAnalysis) {
        context = `\n\nVideo/Audio Analysis Data:\n- Confidence Level: ${videoAnalysis.confidence}\n- Eye Contact: ${videoAnalysis.eyeContact}\n- Speech Clarity: ${videoAnalysis.speechClarity}\n- Emotion: ${videoAnalysis.emotion}\nConsider these non-verbal cues in your evaluation.`;
      }

      const systemPrompt = `You are an expert interview evaluator for ${role} positions (${roundType} round). Evaluate the candidate's answer comprehensively.${context}`;

      const result = await callAI(
        systemPrompt,
        `Question: ${question}\n\nCandidate's Answer: ${answer}\n\nEvaluate this answer.`,
        [{
          type: "function",
          function: {
            name: "return_evaluation",
            description: "Return evaluation",
            parameters: {
              type: "object",
              properties: {
                score: { type: "number", description: "Score from 1-10" },
                feedback: { type: "string", description: "Detailed constructive feedback" },
                improvedAnswer: { type: "string", description: "An improved version of the answer" },
              },
              required: ["score", "feedback", "improvedAnswer"],
              additionalProperties: false,
            },
          },
        }],
        { type: "function", function: { name: "return_evaluation" } }
      );
      if (result instanceof Response) return result;
      return jsonResponse(result);
    }

    // Translate results to multiple languages
    if (action === "translate_results") {
      const { results, targetLanguage } = body;

      const result = await callAI(
        `You are an expert translator. Translate the interview results to ${targetLanguage}. Maintain the same structure and meaning. Keep technical terms in English where appropriate.`,
        `Translate these interview results to ${targetLanguage}:\n\n${JSON.stringify(results)}`,
        [{
          type: "function",
          function: {
            name: "return_translations",
            description: "Return translated results",
            parameters: {
              type: "object",
              properties: {
                translatedResults: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      feedback: { type: "string" },
                      improvedAnswer: { type: "string" },
                    },
                    required: ["question", "feedback", "improvedAnswer"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["translatedResults"],
              additionalProperties: false,
            },
          },
        }],
        { type: "function", function: { name: "return_translations" } }
      );
      if (result instanceof Response) return result;
      return jsonResponse(result);
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("Error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

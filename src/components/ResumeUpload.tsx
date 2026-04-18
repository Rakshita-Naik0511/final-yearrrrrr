import { useState, useRef } from "react";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ResumeUploadProps {
  onParsed: (data: ResumeData) => void;
}

export interface ResumeData {
  name: string;
  role: string;
  experience: string;
  skills: string[];
  education: string;
  summary: string;
  rawText: string;
}

const ResumeUpload = ({ onParsed }: ResumeUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const extractTextFromFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();

    if (ext === "pdf") {
      const pdfjs = await import("pdfjs-dist");
      // Use a fixed version matching package.json for reliability
      const PDFJS_VERSION = "4.10.38";
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((it: any) => it.str).join(" ") + "\n";
      }
      return text.replace(/\s+/g, " ").trim();
    }

    if (ext === "docx" || ext === "doc") {
      const mammothModule: any = await import("mammoth");
      const mammoth = mammothModule.default || mammothModule;
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value.replace(/\s+/g, " ").trim();
    }

    // txt fallback
    const text = await file.text();
    return text.replace(/\s+/g, " ").trim();
  };

  const handleUpload = async (selectedFile: File) => {
    if (!selectedFile) return;

    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "doc", "txt"].includes(ext || "")) {
      toast({ title: "Invalid file", description: "Please upload a PDF, DOCX, or TXT file.", variant: "destructive" });
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" });
      return;
    }

    setFile(selectedFile);
    setParsing(true);

    try {
      // Upload to storage
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(fileName, selectedFile);
      if (uploadError) console.warn("Storage upload failed:", uploadError);

      // Extract text
      const rawText = await extractTextFromFile(selectedFile);
      if (rawText.length < 50) {
        toast({ title: "Could not extract text", description: "Please try a text-based PDF or a TXT file with your resume content.", variant: "destructive" });
        setParsing(false);
        return;
      }

      // Parse with AI
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: { action: "parse_resume", resumeText: rawText.slice(0, 5000) },
      });

      if (error) throw error;

      onParsed({ ...data, rawText: rawText.slice(0, 5000) });
      toast({ title: "Resume parsed!", description: `Welcome, ${data.name}!` });
    } catch (err) {
      console.error(err);
      toast({ title: "Parsing failed", description: "Could not parse resume. Please try again.", variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />

      {!file ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="glass-card flex w-full flex-col items-center gap-3 p-10 transition-all hover:border-primary/50 cursor-pointer"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Upload className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-heading text-sm font-medium text-foreground">Upload Your Resume</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, or TXT (max 5MB)</p>
          </div>
        </button>
      ) : (
        <div className="glass-card flex items-center gap-3 p-4">
          <FileText className="h-8 w-8 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {parsing ? "Parsing with AI..." : "Parsed successfully"}
            </p>
          </div>
          {parsing ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); inputRef.current?.click(); }}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;

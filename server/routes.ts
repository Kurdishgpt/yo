import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import OpenAI from "openai";
import ffmpeg from "fluent-ffmpeg";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function extractAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat("mp3")
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
}

function generateSRT(segments: any[]): string {
  let srt = "";
  segments.forEach((segment, index) => {
    const startTime = formatSRTTime(segment.start);
    const endTime = formatSRTTime(segment.end);
    srt += `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n\n`;
  });
  return srt;
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  await mkdir("uploads", { recursive: true });
  await mkdir("outputs", { recursive: true });

  app.use("/outputs", express.static("outputs"));

  app.post("/api/upload", upload.single("media"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const uploadedFilePath = req.file.path;
      const audioPath = path.join("uploads", `audio-${Date.now()}.mp3`);

      const isVideo = req.file.mimetype.startsWith("video/");
      if (isVideo) {
        await extractAudio(uploadedFilePath, audioPath);
      } else {
        fs.copyFileSync(uploadedFilePath, audioPath);
      }

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["segment"],
      });

      const originalText = transcription.text;

      const translationResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional translator. Translate the following English text to Kurdish (Sorani). Provide only the translation without any additional text.",
          },
          {
            role: "user",
            content: originalText,
          },
        ],
      });

      const translatedText = translationResponse.choices[0].message.content || "";

      const srtContent = generateSRT(
        (transcription as any).segments?.map((seg: any) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
        })) || []
      );

      const ttsResponse = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: translatedText,
      });

      const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
      const outputAudioPath = path.join("outputs", `kurdish-${Date.now()}.mp3`);
      await writeFile(outputAudioPath, audioBuffer);

      fs.unlinkSync(uploadedFilePath);
      if (isVideo || uploadedFilePath !== audioPath) {
        fs.unlinkSync(audioPath);
      }

      res.json({
        transcription: originalText,
        translated: translatedText,
        srt: srtContent,
        tts: `/${outputAudioPath.replace(/\\/g, "/")}`,
      });
    } catch (error: any) {
      console.error("Upload processing error:", error);
      res.status(500).json({
        error: error.message || "Failed to process media file",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

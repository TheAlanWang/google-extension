export type SummaryRequest = {
  text: string;
  ratio?: number;
  style?: "bullets" | "paragraph";
};

export type SummaryResponse = {
  summary: string;
  summary_id: string;
  meta: {
    tokens: number;
    duration_ms: number;
  };
};

export type QARequest = {
  summary_id: string;
  question: string;
};

export type QAResponse = {
  answer: string;
  citations?: Array<{
    from: "summary" | "source";
    span?: [number, number];
  }>;
};

export type UploadResponse = {
  text: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    try {
      const error = await response.json();
      const detail = error.detail ?? error.message ?? response.statusText;
      throw new Error(Array.isArray(detail) ? detail.join(", ") : String(detail));
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error("Request failed");
    }
  }
  return response.json() as Promise<T>;
}

export async function summarize(body: SummaryRequest): Promise<SummaryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/summary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return handleResponse<SummaryResponse>(response);
}

export async function askQuestion(body: QARequest): Promise<QAResponse> {
  const response = await fetch(`${API_BASE_URL}/api/qa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return handleResponse<QAResponse>(response);
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<UploadResponse>(response);
}

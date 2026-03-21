import { useState, useRef } from "react";
import { Upload, X, File, Image, FileText, CheckCircle2 } from "lucide-react";

/**
 * File upload component.
 * Props:
 *   uuid: plan UUID
 *   sectionNumber: int
 *   category: string (file_category for the API)
 *   accept: string
 *   multiple: bool
 *   existingFiles: array of file objects from DB
 *   label: string
 *   description: string
 */
export default function FileUpload({
    uuid,
    sectionNumber,
    category,
    accept = "*",
    multiple = false,
    existingFiles = [],
    label = "Subir archivo",
    description,
}) {
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState([]);
    const inputRef = useRef(null);

    const allFiles = [...existingFiles, ...uploaded];

    const handleUpload = async (e) => {
        const fileList = Array.from(e.target.files || []);
        if (fileList.length === 0) return;

        setUploading(true);
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");

        for (const file of fileList) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("category", category);
            formData.append("section_number", sectionNumber);

            try {
                const res = await fetch(`/planes/${uuid}/seccion/${sectionNumber}/archivo`, {
                    method: "POST",
                    headers: { "X-CSRF-TOKEN": csrfToken },
                    body: formData,
                });
                if (res.ok) {
                    const data = await res.json();
                    setUploaded((prev) => [...prev, data.file]);
                }
            } catch {}
        }

        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
    };

    const deleteFile = async (fileId) => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        await fetch(`/planes/${uuid}/archivos/${fileId}`, {
            method: "DELETE",
            headers: { "X-CSRF-TOKEN": csrfToken, "Accept": "application/json" },
        });
        setUploaded((prev) => prev.filter((f) => f.id !== fileId));
    };

    const getFileIcon = (mime) => {
        if (mime?.startsWith("image/")) return <Image size={14} />;
        if (mime?.includes("pdf")) return <FileText size={14} />;
        return <File size={14} />;
    };

    return (
        <div className="space-y-3">
            {allFiles.length > 0 && (
                <div className="space-y-2">
                    {allFiles.map((f) => (
                        <div key={f.id} className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-lg text-sm">
                            <span className="text-muted-foreground">{getFileIcon(f.mime_type)}</span>
                            <span className="flex-1 truncate">{f.original_name}</span>
                            <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                            <button
                                type="button"
                                onClick={() => deleteFile(f.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-input hover:border-primary/50 rounded-lg px-6 py-8 cursor-pointer transition-colors hover:bg-accent/30"
            >
                <Upload size={20} className="text-muted-foreground" />
                <div className="text-center">
                    <p className="text-sm font-medium">{label}</p>
                    {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
                </div>
                {uploading && <p className="text-xs text-[#208DCA]">Subiendo...</p>}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                onChange={handleUpload}
            />
        </div>
    );
}

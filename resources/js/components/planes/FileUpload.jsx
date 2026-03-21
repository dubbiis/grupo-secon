import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, File, ImageIcon, FileText, CheckCircle2, CloudUpload } from "lucide-react";

export default function FileUpload({
    uuid, sectionNumber, category,
    accept = "*", multiple = false,
    existingFiles = [],
    label = "Subir archivo",
    description,
}) {
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState([]);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    const allFiles = [...existingFiles, ...uploaded];

    const uploadFiles = async (fileList) => {
        if (fileList.length === 0) return;
        setUploading(true);
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");

        for (const file of fileList) {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("category", category);
            fd.append("section_number", sectionNumber);
            try {
                const res = await fetch(`/planes/${uuid}/seccion/${sectionNumber}/archivo`, {
                    method: "POST",
                    headers: { "X-CSRF-TOKEN": csrfToken },
                    body: fd,
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

    const handleChange = (e) => uploadFiles(Array.from(e.target.files || []));

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        uploadFiles(Array.from(e.dataTransfer.files || []));
    };

    const deleteFile = async (fileId) => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        await fetch(`/planes/${uuid}/archivos/${fileId}`, {
            method: "DELETE",
            headers: { "X-CSRF-TOKEN": csrfToken, "Accept": "application/json" },
        });
        setUploaded((prev) => prev.filter((f) => f.id !== fileId));
    };

    const getIcon = (mime) => {
        if (mime?.startsWith("image/")) return <ImageIcon size={13} className="text-[#208DCA]" />;
        if (mime?.includes("pdf")) return <FileText size={13} className="text-orange-400" />;
        return <File size={13} className="text-white/40" />;
    };

    return (
        <div className="space-y-2">
            {/* File list */}
            <AnimatePresence>
                {allFiles.map((f) => (
                    <motion.div
                        key={f.id}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-2.5 px-3 py-2 bg-white/4 border border-white/8 rounded-xl text-xs"
                    >
                        {getIcon(f.mime_type)}
                        <span className="flex-1 truncate text-white/70">{f.original_name}</span>
                        <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />
                        <button
                            type="button"
                            onClick={() => deleteFile(f.id)}
                            className="text-white/20 hover:text-red-400 transition-colors ml-1 flex-shrink-0"
                        >
                            <X size={12} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Drop zone */}
            <motion.div
                animate={{
                    borderColor: dragOver ? "rgba(32,141,202,0.5)" : "rgba(255,255,255,0.1)",
                    backgroundColor: dragOver ? "rgba(32,141,202,0.06)" : "transparent",
                }}
                transition={{ duration: 0.15 }}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-2xl px-6 py-8 cursor-pointer transition-colors group hover:border-[#208DCA]/40 hover:bg-[#208DCA]/4"
            >
                <motion.div
                    animate={{ scale: dragOver ? 1.15 : 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#208DCA]/10 group-hover:border-[#208DCA]/20 transition-colors"
                >
                    {uploading
                        ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Upload size={16} className="text-[#208DCA]" /></motion.div>
                        : <CloudUpload size={16} className="text-white/40 group-hover:text-[#208DCA] transition-colors" />
                    }
                </motion.div>
                <div className="text-center">
                    <p className="text-sm font-medium text-white/60 group-hover:text-white/80 transition-colors">{label}</p>
                    {description && <p className="text-xs text-white/25 mt-0.5">{description}</p>}
                    {uploading && <p className="text-xs text-[#208DCA] mt-1">Subiendo...</p>}
                    {!uploading && <p className="text-xs text-white/20 mt-0.5">Haz clic o arrastra un archivo</p>}
                </div>
            </motion.div>

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                onChange={handleChange}
            />
        </div>
    );
}

"use client";

import { X } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface UploadedFile {
	url: string;
	name: string;
	type: string;
}

interface FileUploadProps {
	value?: (File | UploadedFile)[];
	onChange: (files: (File | UploadedFile)[]) => void;
}

export function FileUpload({ value = [], onChange }: FileUploadProps) {
	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (!e.target.files?.length) return;
			const newFiles = Array.from(e.target.files);
			onChange([...value, ...newFiles]);
		},
		[value, onChange],
	);

	const removeFile = (index: number) => {
		const updated = value.filter((_, i) => i !== index);
		onChange(updated);
	};

	return (
		<div className="space-y-4">
			<div className="grid w-full max-w-sm items-center gap-1.5">
				<Input id="picture" type="file" multiple onChange={handleFileChange} />
			</div>

			<div className="space-y-2">
				{value.map((file, i) => {
					// Determine if it's a raw File or an existing UploadedFile
					const isRawFile = file instanceof File;
					const fileName = isRawFile ? file.name : file.name;
					// Use a combination of name and index to handle duplicate file names
					const uniqueKey = `${fileName}-${i}`;

					return (
						<div
							key={uniqueKey}
							className="flex items-center justify-between rounded-md border p-2 text-sm"
						>
							<span className="flex max-w-[200px] items-center gap-2 truncate">
								{fileName}
								{isRawFile && (
									<span className="font-medium text-amber-500 text-xs">
										(Pending)
									</span>
								)}
							</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => removeFile(i)}
								className="h-8 w-8 text-red-500"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					);
				})}
			</div>
		</div>
	);
}

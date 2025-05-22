"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: (value: string) => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  defaultValue?: string;
  label?: string;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
}

export function InputDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  placeholder = "",
  defaultValue = "",
  label = "",
  type = "text",
  min,
  max,
  step,
}: InputDialogProps) {
  const [isOpen, setIsOpen] = useState(open);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setIsOpen(open);
    if (open) {
      setValue(defaultValue);
    }
  }, [open, defaultValue]);

  const handleConfirm = () => {
    onConfirm(value);
    setIsOpen(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    setIsOpen(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {label && (
            <label className="block text-sm font-medium mb-2">{label}</label>
          )}
          <input
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            className="w-full p-2 border border-theme-splitter rounded-md bg-theme-background focus:outline-none focus:ring-2 focus:ring-theme-accent"
          />
        </div>
        <DialogFooter className="gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-theme-splitter rounded-md hover:bg-theme-splitter"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-md bg-theme-accent hover:bg-theme-accent/90 text-white"
          >
            {confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
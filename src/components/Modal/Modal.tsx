"use client";
import { FC, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.scss";
import Image from "next/image";
import CloseIcon from "@/assets/icons/close.svg";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  isOpen: boolean;
  size?: "sm" | "md" | "lg";
}

export const Modal: FC<ModalProps> = ({
  children,
  onClose,
  isOpen,
  size = "md",
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) {
    return null;
  }

  const modalClassName = `${styles.modal} ${styles[size]}`;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={modalClassName} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Закрыть модальное окно"
        >
          <Image src={CloseIcon} alt="Закрыть" width={20} height={20} />
        </button>
        <div className={styles.content}>{children}</div>
      </div>
    </div>,
    document.body,
  );
};

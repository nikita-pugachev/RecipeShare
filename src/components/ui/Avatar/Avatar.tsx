import styles from "./Avatar.module.scss";
import { FC } from "react";
import Image from "next/image";
import defaultUserIcon from "@/assets/icons/user-icon.svg";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Avatar: FC<AvatarProps> = ({
  src,
  alt = "Аватар пользователя",
  size = "md",
  className = "",
}) => {
  const sizeClass = styles[size];

  const dimensions = {
    sm: 32,
    md: 48,
    lg: 96,
  };

  const currentSize = dimensions[size];

  return (
    <div className={`${styles.avatarWrapper} ${sizeClass} ${className}`}>
      <Image
        src={src || defaultUserIcon}
        alt={alt}
        width={currentSize}
        height={currentSize}
        className={styles.avatarImage}
      />
    </div>
  );
};

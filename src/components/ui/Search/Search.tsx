"use client";
import styles from "./Search.module.scss";
import { Input } from "@/components/ui/Input/Input";
import { FC, useState } from "react";
import Image from "next/image";
import closeIcon from "@/assets/icons/close.svg";
import searchIcon from "@/assets/icons/search-icon.svg";

interface SearchProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}

export const Search: FC<SearchProps> = ({ value, placeholder, onChange }) => {
  const [localState, setLocalState] = useState<string>("");
  const currentValue = value ?? localState;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (value === undefined) {
      setLocalState(val);
    }
    onChange?.(val);
  };

  const handleClear = () => {
    if (value === undefined) {
      setLocalState("");
    }
    onChange?.("");
  };

  return (
    <Input
      value={currentValue}
      placeholder={placeholder}
      aria-label="Поиск"
      onChange={handleTextChange}
      onClick={handleClear}
      className={styles.searchInput}
      icon={
        currentValue && (
          <Image className={styles.icon} src={closeIcon} alt="close" />
        )
      }
      categoryIcon={<Image src={searchIcon} alt="search" />}
    />
  );
};

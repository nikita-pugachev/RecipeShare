"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import { FileInput } from "@/components/ui/FileInput/FileInput";
import styles from "./profilePage.module.scss";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const supabase = createClient();

  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  useEffect(() => {
    if (user) {
      if (user.user_metadata?.name) setName(user.user_metadata.name);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setAvatarFile(files[0]);
    } else {
      setAvatarFile(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      let uploadedAvatarUrl = user.user_metadata?.avatar_url || null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `avatar_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError)
          throw new Error(
            "Не удалось загрузить аватарку: " + uploadError.message,
          );

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        uploadedAvatarUrl = publicUrl;
      }

      const trimmedName = name.trim();
      const trimmedEmail = email.replace(/[\s\u200b\u00a0]/g, "");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const updates: any = {
        data: {
          name: trimmedName,
          avatar_url: uploadedAvatarUrl,
        },
      };

      if (trimmedEmail !== user.email) {
        if (!trimmedEmail) {
          throw new Error("Электронная почта не может быть пустой");
        }
        if (!emailRegex.test(trimmedEmail)) {
          throw new Error(
            "Введен некорректный формат электронной почты (например, name@example.com)",
          );
        }
        updates.email = trimmedEmail;
      }

      if (isChangingPassword && password) {
        if (password.length < 6) {
          throw new Error("Пароль должен быть не менее 6-ти символов");
        }
        updates.password = password;
      }

      const {
        data: { user: updatedUser },
        error: updateError,
      } = await supabase.auth.updateUser(updates);

      if (updateError) throw updateError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: trimmedName,
          avatar_url: uploadedAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await refreshUser();

      if (updatedUser?.new_email && updatedUser.new_email !== user.email) {
        setMessage({
          type: "success",
          text: `Запрос отправлен! Подтвердите смену почты по ссылке в письме, отправленном на адрес ${updatedUser.new_email}`,
        });
      } else {
        setMessage({
          type: "success",
          text: "Данные профиля успешно обновлены!",
        });
      }
      setPassword("");
      setIsChangingPassword(false);
      setAvatarFile(null);
      setFileInputKey((prev) => prev + 1);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Произошла ошибка при сохранении",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>Настройки профиля</h1>
      <form onSubmit={handleUpdateProfile} className={styles.form}>
        <div className={styles.avatarUploadGroup}>
          <span className={styles.label}>Фотография профиля</span>
          <FileInput
            key={fileInputKey}
            id="avatar-upload"
            label="Загрузить аватарку"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <Input
          type="text"
          id="username"
          label="Имя пользователя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Введите ваше имя"
        />

        <Input
          type="email"
          id="email"
          label="Электронная почта"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Введите почту"
        />

        {!isChangingPassword ? (
          <button
            type="button"
            className={styles.changePasswordToggle}
            onClick={() => setIsChangingPassword(true)}
          >
            Изменить пароль
          </button>
        ) : (
          <div className={styles.passwordFields}>
            <Input
              type="password"
              id="password"
              label="Новый пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите новый пароль"
              required
            />
            <button
              type="button"
              className={styles.cancelPasswordToggle}
              onClick={() => {
                setIsChangingPassword(false);
                setPassword("");
              }}
            >
              Отменить изменение пароля
            </button>
          </div>
        )}

        <Button
          type="submit"
          variant="main"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? "Сохранение..." : "Сохранить изменения"}
        </Button>
        {message && (
          <div
            className={`${styles.messageAlert} ${message.type === "success" ? styles.successAlert : styles.errorAlert}`}
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}

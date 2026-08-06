import styles from "./CardPost.module.scss";
import { FC, memo } from "react";
import Image from "next/image";
import { Avatar } from "../ui/Avatar/Avatar";
import { Button } from "../ui/Button/Button";
import favoriteIcon from "@/assets/icons/favorite.svg";
import likeActiveIcon from "@/assets/icons/like-active.svg";
import logoIcon from "@/assets/icons/logo_icon.jpg";

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  image_url?: string | null;
  author_id: string;
  author_name?: string;
  author_avatar?: string | null;
  likes_count: number;
}

interface CardPostProps {
  recipe: Recipe;
  isLiked?: boolean;
  onLikeToggle?: (id: string) => void;
  onDetailsClick?: (recipe: Recipe) => void;
  onDelete?: (id: string) => void;
}

export const CardPost: FC<CardPostProps> = memo(({
  recipe,
  isLiked = false,
  onLikeToggle,
  onDetailsClick,
  onDelete,
}) => {
  const currentLikeIcon = isLiked ? likeActiveIcon : favoriteIcon;
  const recipeImageSrc = recipe.image_url || logoIcon;

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <Avatar src={recipe.author_avatar} size="md" />
        <span className={styles.authorName}>{recipe.author_name || "Анонимный автор"}</span>
        {onDelete && (
          <button
            type="button"
            className={styles.headerDeleteButton}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(recipe.id);
            }}
            aria-label="Удалить рецепт"
          >
            Удалить
          </button>
        )}
      </div>

      <h3 className={styles.recipeTitle}>{recipe.title}</h3>

      <div className={styles.imageWrapper}>
        <Image
          src={recipeImageSrc}
          alt={recipe.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className={styles.recipeImage}
        />
      </div>

      <div className={styles.ingredientsList}>
        {recipe.ingredients?.map((ingredient, index) => (
          <span key={`${ingredient}-${index}`} className={styles.ingredientBadge}>
            {ingredient}
          </span>
        ))}
      </div>

      <p className={styles.description}>{recipe.description}</p>

      <div className={styles.cardFooter}>
        <button
          type="button"
          className={`${styles.likeButton} ${isLiked ? styles.liked : ""}`}
          onClick={() => onLikeToggle?.(recipe.id)}
        >
          <Image
            src={currentLikeIcon}
            alt="лайк"
            width={20}
            height={20}
            className={styles.likeIcon}
          />
          <span className={styles.likesCount}>{recipe.likes_count}</span>
        </button>

        <Button variant="main" onClick={() => onDetailsClick?.(recipe)}>
          Подробнее
        </Button>
      </div>
    </article>
  );
});

CardPost.displayName = "CardPost";


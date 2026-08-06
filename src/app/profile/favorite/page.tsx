'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CardPost } from '@/components/CardPost/CardPost';
import { Modal } from '@/components/Modal/Modal';
import { PostInfo } from '@/components/PostInfo/PostInfo';
import styles from '../subpage.module.scss';

const supabase = createClient();

export default function FavoritePage() {
    const { user } = useAuth();

    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);

    const fetchFavoriteRecipes = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: likes, error: likesError } = await supabase
                .from('likes')
                .select('recipe_id')
                .eq('user_id', user.id);

            if (likesError) throw likesError;

            const likedIds = likes?.map((like: any) => like.recipe_id) || [];

            if (likedIds.length === 0) {
                setRecipes([]);
                return;
            }

            const { data: favoritedRecipes, error: recipesError } = await supabase
                .from('recipes_with_details')
                .select('*')
                .in('id', likedIds)
                .order('created_at', { ascending: false });

            if (recipesError) throw recipesError;
            setRecipes(favoritedRecipes || []);
        } catch (err) {
            console.error('Ошибка при загрузке избранных рецептов:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchFavoriteRecipes();
    }, [fetchFavoriteRecipes]);

    const handleLikeToggle = useCallback(async (recipeId: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('likes')
                .delete()
                .eq('user_id', user.id)
                .eq('recipe_id', recipeId);

            if (error) throw error;
            setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
        } catch (err) {
            console.error('Ошибка при удалении из избранного:', err);
        }
    }, [user]);

    const handleDetailsClick = useCallback((recipe: any) => {
        setSelectedRecipe(recipe);
        const newUrl = `${window.location.pathname}?recipeId=${recipe.id}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    }, []);

    const handleCloseDetails = useCallback(() => {
        setSelectedRecipe(null);
        const cleanUrl = window.location.pathname;
        window.history.pushState({ path: cleanUrl }, '', cleanUrl);
    }, []);

    return (
        <div>
            <h1 className={styles.title}>Избранное</h1>
            <p className={styles.description}>
                Здесь отображаются рецепты, которые вы отметили лайком.
            </p>

            {loading ? (
                <div className={styles.loader}>Загрузка избранного...</div>
            ) : recipes.length === 0 ? (
                <div className={styles.empty}>Вы еще не добавили ни одного рецепта в избранное.</div>
            ) : (
                <div className={styles.grid}>
                    {recipes.map(recipe => (
                        <CardPost 
                            key={recipe.id}
                            recipe={recipe}
                            isLiked={true}
                            onLikeToggle={handleLikeToggle}
                            onDetailsClick={handleDetailsClick}
                        />
                    ))}
                </div>
            )}

            <Modal isOpen={!!selectedRecipe} onClose={handleCloseDetails}>
                {selectedRecipe && (
                    <PostInfo recipe={selectedRecipe} onClose={handleCloseDetails} />
                )}
            </Modal>
        </div>
    );
}


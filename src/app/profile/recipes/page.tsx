'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CardPost } from '@/components/CardPost/CardPost';
import { Modal } from '@/components/Modal/Modal';
import { PostInfo } from '@/components/PostInfo/PostInfo';
import { Button } from '@/components/ui/Button/Button';
import styles from '../subpage.module.scss';

const supabase = createClient();

export default function RecipesPage() {
    const { user } = useAuth();

    const [recipes, setRecipes] = useState<any[]>([]);
    const [likedRecipeIds, setLikedRecipeIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
    
    const [recipeToDeleteId, setRecipeToDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchMyRecipes = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('recipes_with_details')
                .select('*')
                .eq('author_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRecipes(data || []);

            const { data: likes, error: likesError } = await supabase
                .from('likes')
                .select('recipe_id')
                .eq('user_id', user.id);

            if (likesError) throw likesError;
            const likedIds = new Set<string>(likes?.map((like: any) => like.recipe_id as string) || []);
            setLikedRecipeIds(likedIds);
        } catch (err) {
            console.error('Ошибка при загрузке ваших рецептов:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMyRecipes();
    }, [fetchMyRecipes]);

    const handleLikeToggle = useCallback(async (recipeId: string) => {
        if (!user) return;

        const isAlreadyLiked = likedRecipeIds.has(recipeId);

        try {
            if (isAlreadyLiked) {
                const { error } = await supabase
                    .from('likes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('recipe_id', recipeId);

                if (error) throw error;

                setLikedRecipeIds(prev => {
                    const next = new Set(prev);
                    next.delete(recipeId);
                    return next;
                });
                setRecipes(prev => prev.map(recipe => 
                    recipe.id === recipeId ? { ...recipe, likes_count: Math.max(0, recipe.likes_count - 1) } : recipe
                ));
            } else {
                const { error } = await supabase
                    .from('likes')
                    .insert({
                        user_id: user.id,
                        recipe_id: recipeId
                    });

                if (error) throw error;

                setLikedRecipeIds(prev => {
                    const next = new Set(prev);
                    next.add(recipeId);
                    return next;
                });
                setRecipes(prev => prev.map(recipe => 
                    recipe.id === recipeId ? { ...recipe, likes_count: recipe.likes_count + 1 } : recipe
                ));
            }
        } catch (err) {
            console.error('Ошибка при переключении лайка:', err);
        }
    }, [user, likedRecipeIds]);

    const executeDelete = useCallback(async () => {
        if (!recipeToDeleteId || !user) return;
        setDeleting(true);

        try {
            const recipeToDelete = recipes.find(recipe => recipe.id === recipeToDeleteId);

            const { error: deleteError } = await supabase
                .from('recipes')
                .delete()
                .eq('id', recipeToDeleteId)
                .eq('author_id', user.id);

            if (deleteError) throw deleteError;

            if (recipeToDelete?.image_url) {
                const parts = recipeToDelete.image_url.split('/recipe-images/');
                if (parts.length > 1) {
                    const filePath = parts[1];
                    const { error: storageError } = await supabase.storage
                        .from('recipe-images')
                        .remove([filePath]);
                    
                    if (storageError) {
                        console.error('Ошибка при очистке картинки из Storage:', storageError);
                    }
                }
            }

            setRecipes(prev => prev.filter(r => r.id !== recipeToDeleteId));
            setRecipeToDeleteId(null);
        } catch (err: any) {
            console.error('Ошибка при удалении рецепта:', err);
            alert('Не удалось удалить рецепт: ' + (err.message || err));
        } finally {
            setDeleting(false);
        }
    }, [recipeToDeleteId, user, recipes]);

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

    const handleSetRecipeToDelete = useCallback((id: string) => {
        setRecipeToDeleteId(id);
    }, []);

    const handleCancelDelete = useCallback(() => {
        setRecipeToDeleteId(null);
    }, []);

    return (
        <div>
            <h1 className={styles.title}>Мои записи</h1>
            <p className={styles.description}>
                Здесь отображаются все рецепты, которые вы опубликовали на платформе.
            </p>

            {loading ? (
                <div className={styles.loader}>Загрузка ваших записей...</div>
            ) : recipes.length === 0 ? (
                <div className={styles.empty}>Вы еще не опубликовали ни одного рецепта.</div>
            ) : (
                <div className={styles.grid}>
                    {recipes.map(recipe => (
                        <CardPost 
                            key={recipe.id}
                            recipe={recipe}
                            isLiked={likedRecipeIds.has(recipe.id)}
                            onLikeToggle={handleLikeToggle}
                            onDetailsClick={handleDetailsClick}
                            onDelete={handleSetRecipeToDelete}
                        />
                    ))}
                </div>
            )}

            <Modal isOpen={!!selectedRecipe} onClose={handleCloseDetails}>
                {selectedRecipe && (
                    <PostInfo recipe={selectedRecipe} onClose={handleCloseDetails} />
                )}
            </Modal>

            <Modal isOpen={!!recipeToDeleteId} onClose={handleCancelDelete} size="sm">
                <div className={styles.confirmModalContent}>
                    <h2 className={styles.confirmTitle}>Удаление рецепта</h2>
                    <p className={styles.confirmText}>
                        Вы действительно хотите удалить этот рецепт? Это действие нельзя отменить.
                    </p>
                    <div className={styles.confirmButtons}>
                        <Button variant="secondary" onClick={handleCancelDelete} disabled={deleting}>
                            Отмена
                        </Button>
                        <Button variant="main" onClick={executeDelete} disabled={deleting}>
                            {deleting ? 'Удаление...' : 'Да, удалить'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}


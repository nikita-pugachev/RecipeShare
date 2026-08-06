'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CardPost } from '../CardPost/CardPost';
import { Modal } from '@/components/Modal/Modal';
import { PostInfo } from '@/components/PostInfo/PostInfo';
import styles from './CardList.module.scss';

interface CardListProps {
    searchQuery?: string;
    refreshTrigger?: number;
}

const supabase = createClient();

export const CardList = ({ searchQuery = "", refreshTrigger = 0 }: CardListProps) => {
    const { user } = useAuth();
    
    const [recipes, setRecipes] = useState<any[]>([]);
    const [likedRecipeIds, setLikedRecipeIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);

    const fetchRecipes = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('recipes_with_details')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            const fetchedRecipes = data || [];
            setRecipes(fetchedRecipes);

            const params = new URLSearchParams(window.location.search);
            const urlRecipeId = params.get('recipeId');
            if (urlRecipeId) {
                const matched = fetchedRecipes.find((recipe: any) => recipe.id === urlRecipeId);
                if (matched) {
                    setSelectedRecipe(matched);
                }
            }

            if (user) {
                const { data: likes, error: likesError } = await supabase
                    .from('likes')
                    .select('recipe_id')
                    .eq('user_id', user.id);

                if (likesError) throw likesError;
                const likedIds = new Set<string>(likes?.map((like: any) => like.recipe_id as string) || []);
                setLikedRecipeIds(likedIds);
            }
        } catch (err) {
            console.error('Ошибка при загрузке рецептов:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes, refreshTrigger]);

    const handleLikeToggle = useCallback(async (recipeId: string) => {
        if (!user) {
            alert('Войдите в аккаунт, чтобы ставить лайки!');
            return;
        }

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
                setRecipes(prev => prev.map(r => 
                    r.id === recipeId ? { ...r, likes_count: Math.max(0, r.likes_count - 1) } : r
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
                setRecipes(prev => prev.map(r => 
                    r.id === recipeId ? { ...r, likes_count: r.likes_count + 1 } : r
                ));
            }
        } catch (err) {
            console.error('Ошибка при переключении лайка:', err);
        }
    }, [user, likedRecipeIds]);

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

    const sortedRecipes = useMemo(() => {
        if (!searchQuery.trim()) {
            return recipes;
        }
        
        const query = searchQuery.toLowerCase().trim();
        
        return [...recipes].sort((a, b) => {
            const aMatches = a.title.toLowerCase().includes(query);
            const bMatches = b.title.toLowerCase().includes(query);
            
            if (aMatches && !bMatches) return -1;
            if (!aMatches && bMatches) return 1;
            return 0;
        });
    }, [recipes, searchQuery]);

    if (loading) {
        return <div className={styles.loader}>Загрузка рецептов...</div>;
    }

    if (recipes.length === 0) {
        return <div className={styles.empty}>Рецептов пока нет. Будьте первыми, кто поделится!</div>;
    }

    return (
        <>
            <div className={styles.grid}>
                {sortedRecipes.map(recipe => (
                    <CardPost 
                        key={recipe.id}
                        recipe={recipe}
                        isLiked={likedRecipeIds.has(recipe.id)}
                        onLikeToggle={handleLikeToggle}
                        onDetailsClick={handleDetailsClick}
                    />
                ))}
            </div>

            <Modal isOpen={!!selectedRecipe} onClose={handleCloseDetails}>
                {selectedRecipe && (
                    <PostInfo recipe={selectedRecipe} onClose={handleCloseDetails} />
                )}
            </Modal>
        </>
    );
};


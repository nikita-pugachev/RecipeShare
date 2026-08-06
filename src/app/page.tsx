'use client';
import { useState, useCallback } from 'react';
import styles from '@/app/app.module.scss';
import { Header } from '@/components/Header/Header';
import { Modal } from '@/components/Modal/Modal';
import { CreatePost } from '@/components/CreatePost/CreatePost';
import { CardList } from '@/components/CardList/CardList';
import { useDebounce } from '@/hooks/useDebounce';

export default function Page() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const handleRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const handleOpenCreate = useCallback(() => {
        setIsCreateOpen(true);
    }, []);

    const handleCloseCreate = useCallback(() => {
        setIsCreateOpen(false);
    }, []);

    return (
        <>
            <Header 
                onCreatePost={handleOpenCreate} 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
            
            <main className={styles.feedContainer}>
                <CardList searchQuery={debouncedSearchQuery} refreshTrigger={refreshTrigger} />
            </main>

            <Modal isOpen={isCreateOpen} onClose={handleCloseCreate}>
                <CreatePost onClose={handleCloseCreate} onSuccess={handleRefresh} />
            </Modal>
        </>
    );
}
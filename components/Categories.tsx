
import React, { useState, useEffect } from 'react';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { Category } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

interface CategoriesProps {
  finance: UseFinanceReturn;
}

const CategoryForm: React.FC<{
    onSave: (name: string) => void;
    onClose: () => void;
    initialData?: Category | null;
}> = ({ onSave, onClose, initialData }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave(name);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="category-name" className="block text-sm font-medium text-gray-300">Category Name</label>
                <input id="category-name" type="text" value={name} onChange={e => setName(e.target.value)} required autoFocus className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit">{initialData ? 'Save Changes' : 'Add Category'}</Button>
            </div>
        </form>
    );
};

const Categories: React.FC<CategoriesProps> = ({ finance }) => {
    const { categories, addCategory, editCategory, deleteCategory } = finance;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const handleOpenModal = (category: Category | null = null) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleSaveCategory = (name: string) => {
        if (editingCategory) {
            editCategory({ ...editingCategory, name });
        } else {
            addCategory(name);
        }
    };
    
    const handleDeleteCategory = (id: string) => {
        // Confirmation is handled inside useFinance hook via alert
        deleteCategory(id);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-white">Manage Categories</h1>
                <Button onClick={() => handleOpenModal()}>Add New Category</Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category Name</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {categories.map(cat => (
                                <tr key={cat.id} className="hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{cat.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center gap-4">
                                            <button onClick={() => handleOpenModal(cat)} className="text-blue-400 hover:text-blue-300 transition-colors"><EditIcon /></button>
                                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-300 transition-colors"><DeleteIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCategory ? 'Edit Category' : 'Add New Category'}>
                <CategoryForm onSave={handleSaveCategory} onClose={handleCloseModal} initialData={editingCategory} />
            </Modal>
        </div>
    );
};

export default Categories;

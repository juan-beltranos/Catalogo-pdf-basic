import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, Trash2, Package, Image as ImageIcon, Edit2, X, Check } from 'lucide-react';
import { compressImage, formatCurrency } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { RichTextEditor } from './RichTextEditor';
import { getImageUrl } from '@/helper/imageDB';
import { ProductThumb } from './ProductThumb';

interface ProductManagerProps {
  products: Product[];
  onAdd: (product: Product) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Product>) => void;
  onDownloadPdfAll?: () => void;
}

export const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  onAdd,
  onRemove,
  onUpdate,
  onDownloadPdfAll,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    imageId: '',
  });

  const [imagePreview, setImagePreview] = useState<string>('');

  const resetForm = () => {
    setFormData({ name: '', price: '', description: '', image: '', imageId: '' });
    setIsAdding(false);
    setEditingId(null);
    setImagePreview('');
  };

  const handleOpenEdit = async (product: Product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      image: product.image || '',
      imageId: product.imageId || '',
    });

    setEditingId(product.id);
    setIsAdding(false);

    if (product.image) {
      setImagePreview(product.image);
      return;
    }

    if (product.imageId) {
      const url = await getImageUrl(product.imageId);
      setImagePreview(url || '');
    } else {
      setImagePreview('');
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) return;

    const productData: Partial<Product> = {
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      description: formData.description,
      image: formData.image,
      imageId: formData.imageId,
    };

    if (editingId) {
      onUpdate(editingId, productData);
    } else {
      onAdd({
        id: Date.now().toString(),
        name: productData.name as string,
        price: productData.price as number,
        description: productData.description as string,
        image: productData.image as string,
        imageId: productData.imageId as string,
      });
    }

    resetForm();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressImage(file);
      setFormData((prev) => ({ ...prev, image: base64, imageId: '' }));
      setImagePreview(base64);
    } catch (err) {
      console.error('Error processing product image', err);
    }
  };

  const isEditing = editingId !== null;

  return (
    <div className="space-y-4 mb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Tus Productos
        </h2>

        <div className="flex items-center gap-2">
          {/* Botón PDF (Todo) opcional */}
          {onDownloadPdfAll && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={onDownloadPdfAll}
                className="bg-slate-900 text-white px-3 py-2 rounded-xl text-sm hover:bg-slate-800"
              >
                PDF (Todo)
              </button>
            </div>
          )}

          <button
            onClick={() => {
              if (isAdding || isEditing) resetForm();
              else setIsAdding(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
          >
            {isAdding || isEditing ? (
              <>
                <X className="w-4 h-4" /> Cancelar
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Nuevo
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {(isAdding || isEditing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-2xl shadow-sm border-2 border-blue-500 space-y-4"
          >
            <h3 className="font-bold text-lg text-blue-900">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    placeholder="Precio"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <RichTextEditor
                  value={formData.description}
                  onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                  placeholder="Descripción (opcional)"
                />
              </div>

              {/* Image */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-blue-400 transition-colors cursor-pointer relative bg-slate-50 min-h-[200px]">
                {imagePreview ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-40 object-contain rounded-lg mb-2"
                    />
                    <button
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, image: '', imageId: '' }));
                        setImagePreview('');
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Quitar imagen
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                    <span className="text-sm text-slate-500">Añadir foto del producto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!formData.name || !formData.price}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isEditing ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {products.map((product) => (
            <motion.div
              layout
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`bg-white rounded-2xl p-4 shadow-sm border group relative transition-all ${editingId === product.id ? 'border-blue-500 ring-2 ring-blue-50' : 'border-slate-100'
                }`}
            >
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={() => handleOpenEdit(product)}
                  className="bg-blue-100 text-blue-600 p-2 rounded-full shadow-sm border border-blue-200 hover:bg-blue-200"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRemove(product.id)}
                  className="bg-red-100 text-red-600 p-2 rounded-full shadow-sm border border-red-200 hover:bg-red-200"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                  <ProductThumb product={product} className="max-w-full max-h-full object-contain block" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{product.name}</h3>
                  <p className="text-blue-600 font-semibold mt-1">{formatCurrency(product.price)}</p>

                  <div
                    className="text-xs text-slate-500 line-clamp-2 mt-1 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description || '<p>Sin descripción</p>' }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {products.length === 0 && !isAdding && !isEditing && (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">Aún no tienes productos. ¡Agrega el primero!</p>
          </div>
        )}
      </div>
    </div>
  );
};

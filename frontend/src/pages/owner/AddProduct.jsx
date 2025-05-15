import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getProductById, 
  createProduct, 
  updateProduct, 
  getCategories 
} from '../../services/product.service';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import '../../styles/add-product.css';

const AddProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    stock: '',
    weight: '',
    origin: '',
    shelfLife: '',
    storage: '',
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    
    fetchCategories();
    
    if (isEditMode) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const product = await getProductById(id);
          setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price?.toString() || '',
            category: product.category || '',
            image: product.image || '',
            stock: product.stock?.toString() || '',
            weight: product.weight || '',
            origin: product.origin || '',
            shelfLife: product.shelfLife || '',
            storage: product.storage || '',
          });
          
          if (product.image) {
            setPreviewImage(product.image);
          }
        } catch (error) {
          console.error('Failed to fetch product:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchProduct();
    }
  }, [id, isEditMode]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // In a real app, you would upload the file to a server
    // For demo, we'll use a local URL
    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);
    setFormData(prev => ({ ...prev, image: imageUrl }));
    
    // Clear error
    if (errors.image) {
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be a positive number';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!isEditMode && !previewImage) {
      newErrors.image = 'Product image is required';
    }
    
    if (formData.stock && isNaN(formData.stock)) {
      newErrors.stock = 'Stock must be a number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: formData.stock ? parseInt(formData.stock) : undefined,
        inStock: formData.stock ? parseInt(formData.stock) > 0 : true,
      };
      
      if (isEditMode) {
        await updateProduct(id, productData);
      } else {
        await createProduct(productData);
      }
      
      navigate('/owner/products');
    } catch (error) {
      console.error('Failed to save product:', error);
      setErrors(prev => ({ 
        ...prev, 
        submit: error.message || 'Failed to save product. Please try again.' 
      }));
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="product-form-loading">
        <div className="loader"></div>
        <p>Loading product data...</p>
      </div>
    );
  }
  
  return (
    <div className="add-product-page">
      <div className="page-header">
        <h1>{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
      </div>
      
      <div className="product-form-container">
        <form className="product-form" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="form-error-message">{errors.submit}</div>
          )}
          
          <div className="form-sections">
            <div className="form-section">
              <h2 className="section-title">Basic Information</h2>
              
              <div className="form-group">
                <Input
                  label="Product Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`form-textarea ${errors.description ? 'error' : ''}`}
                  rows="4"
                  required
                ></textarea>
                {errors.description && (
                  <div className="form-error">{errors.description}</div>
                )}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <Input
                    label="Price ($)"
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    error={errors.price}
                    required
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    Category <span className="required">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`form-select ${errors.category ? 'error' : ''}`}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                    <option value="other">Other</option>
                  </select>
                  {errors.category && (
                    <div className="form-error">{errors.category}</div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <Input
                  label="Stock Quantity"
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  error={errors.stock}
                  min="0"
                />
              </div>
            </div>
            
            <div className="form-section">
              <h2 className="section-title">Product Image</h2>
              
              <div className="image-upload-container">
                <div className="image-preview">
                  {previewImage ? (
                    <img src={previewImage} alt="Product preview" className="preview-image" />
                  ) : (
                    <div className="no-image">
                      <div className="no-image-icon">📷</div>
                      <p>No image selected</p>
                    </div>
                  )}
                </div>
                
                <div className="image-upload-controls">
                  <label className="upload-btn">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file-input"
                    />
                    {previewImage ? 'Change Image' : 'Upload Image'}
                  </label>
                  
                  {previewImage && (
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => {
                        setPreviewImage(null);
                        setFormData(prev => ({ ...prev, image: '' }));
                      }}
                    >
                      Remove Image
                    </button>
                  )}
                  
                  {errors.image && (
                    <div className="form-error">{errors.image}</div>
                  )}
                </div>
              </div>
              
              <div className="image-guidelines">
                <h3>Image Guidelines:</h3>
                <ul>
                  <li>Use high-quality images with clear background</li>
                  <li>Recommended size: 800×800 pixels</li>
                  <li>Maximum file size: 5MB</li>
                  <li>Supported formats: JPG, PNG, WebP</li>
                </ul>
              </div>
            </div>
            
            <div className="form-section">
              <h2 className="section-title">Additional Details (Optional)</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <Input
                    label="Weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="e.g. 500g, 1kg"
                  />
                </div>
                
                <div className="form-group">
                  <Input
                    label="Origin"
                    name="origin"
                    value={formData.origin}
                    onChange={handleChange}
                    placeholder="e.g. Local, Imported"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <Input
                    label="Shelf Life"
                    name="shelfLife"
                    value={formData.shelfLife}
                    onChange={handleChange}
                    placeholder="e.g. 3-5 days"
                  />
                </div>
                
                <div className="form-group">
                  <Input
                    label="Storage"
                    name="storage"
                    value={formData.storage}
                    onChange={handleChange}
                    placeholder="e.g. Refrigerate"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/owner/products')}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
            >
              {isEditMode ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
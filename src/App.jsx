import { useEffect, useRef, useState } from 'react'
import axios from 'axios';
import { Modal } from 'bootstrap';

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

const defaultModalState = {
  imageUrl: "",
  title: "",
  category: "",
  unit: "",
  origin_price: "",
  price: "",
  description: "",
  content: "",
  is_enabled: 0,
  imagesUrl: [""]
};

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [products, setProducts] = useState([]);
  const [ user, setUser ] = useState({
    username: '',
    password: ''
  });

  function handleUser(e) {
    const { name, value } = e.target;
    setUser({//會全部覆蓋值
      ...user,//展開：把原始物件展開帶入
      [name]: value
    })
    console.log(user);
  }

  const getProducts = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/v2/api/${API_PATH}/admin/products`
      );
      setProducts(res.data.products);
    } catch (error) {
      alert("取得產品失敗");
    }
  };
  // 登入 async await 的寫法
  const login = async(e) => {
    e.preventDefault();//可以解除button的預設行為，這樣 button 可以不加入 type="button" 然後使用 Enter，就可以觸發事件。
    
    try {
        const res = await axios.post(`${BASE_URL}/v2/admin/signin`, user)
        //取得 token
        const { token, expired } = res.data;
        document.cookie = `camiToken=${token}; expires='${new Date(expired)}'; path=/`;

        axios.defaults.headers.common['Authorization'] = token;//帶入 token

        //取得產品列表
        getProducts();

        setIsAuth(true);
      
    } catch (error) {
      console.log('登入失敗');
      
    }
  }

  
  const checkUserLogin = async() => {
    try {
      await axios.post(`${BASE_URL}/v2/api/user/check`);
      getProducts();
      setIsAuth(true);
      
    } catch (error) {
      console.log(error);
      
    }
  }

  useEffect(() => {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)camiToken\s*\=\s*([^;]*).*$)|^.*$/,
      "$1",
    );
    axios.defaults.headers.common['Authorization'] = token;
    checkUserLogin();
  }, [])


  const productModalRef = useRef(null);
  const deleteProductModalRef = useRef(null);
  const [modalMode, setModalMode] = useState(null); //判斷當前動作是新增產品還是編輯產品，新增一個狀態來判斷

  useEffect(() => {
    // new Modal(productModalRef.current);//建立 Modal 實例
    new Modal(productModalRef.current, {
      backdrop: false
    });//加上 backdrop: false 可以讓點及半透明灰時，不會關掉 Modal
    
    new Modal(deleteProductModalRef.current, {
      backdrop: false
    });
  }, [])

  const handleOpenProductModal = (mode, product) => {
    setModalMode(mode);
    // setTempProduct(product || defaultModalState);//判斷是新增還是編輯
    //也可以使用 switch case來判斷
    switch (mode) {
      case 'create':
        setTempProduct(defaultModalState);
        break;
      
      case 'edit':
        setTempProduct({
          ...product,
          imagesUrl: product.imagesUrl ? [...product.imagesUrl] : [""], // 確保 imagesUrl 是陣列
        });
        break;

      default:
        break;
    }

    const modalInstance = Modal.getInstance(productModalRef.current); // 取得 Modal 實例
    modalInstance.show();
  }
  const handleCloseProductModal = () => {
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.hide();
  }

  const handleOpenDelProductModal = (product) => {
    setTempProduct(product);
    const modalInstance = Modal.getInstance(deleteProductModalRef.current);
    modalInstance.show();
  }

  const handleCloseDelProductModal = () => {
    const modalInstance = Modal.getInstance(deleteProductModalRef.current);
    modalInstance.hide();
  }


  const [tempProduct, setTempProduct] = useState(defaultModalState);
  const handleModalInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setTempProduct({
      ...tempProduct,
      [name]: type === "checkbox" ? checked : value
    })
  }

  const handleImageChange = (e, index) => { 
    const {value} = e.target;   
    const newImages = tempProduct.imagesUrl ? [...tempProduct.imagesUrl] : [""]; // 確保有陣列
    newImages[index] = value;

    setTempProduct((prev) => ({
      ...prev,
      imagesUrl: newImages
    }));
  }

  const handleAddImage = () => {
    const newImages = tempProduct.imagesUrl ? [...tempProduct.imagesUrl, ""] : [""]; // 確保有陣列

    setTempProduct((prev) => ({
      ...prev,
      imagesUrl: newImages
    }));
  }

  const handleRemoveImage = () => {
    const newImages = tempProduct.imagesUrl ? [...tempProduct.imagesUrl] : [""]; // 確保有陣列
    newImages.pop();

    setTempProduct((prev) => ({
      ...prev,
      imagesUrl: prev.imagesUrl.length > 1 ? prev.imagesUrl.slice(0, -1) : [""]
    }));
  }

  const creatProduct = async () => {
    try {
      await axios.post(`${BASE_URL}/v2/api/${API_PATH}/admin/product`, { 
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0
        } 
      });
    } catch (error) {
      console.log(error);
      alert('新增產品失敗');
    }
  }

  const updateProduct = async () => {
    try {
      await axios.put(`${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`, { 
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0
        } 
      });
    } catch (error) {
      console.log(error);
      alert('編輯產品失敗');
    }
  }

  const handleUpdateProduct = async () => {
    const apiCall = modalMode === 'create' ? creatProduct : updateProduct;

    try {
      await apiCall();
      getProducts();
      handleCloseProductModal();
    } catch (error) {
      alert('更新產品失敗');
    }
  }

  const deleteProduct = async () => {
    try {
      await axios.delete(`${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`, { 
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0
        } 
      });
    } catch (error) {
      console.log(error);
      alert('刪除產品失敗');
    }
  }

  const handleDeleteProduct = async () => {
    try {
      await deleteProduct();
      getProducts();
      handleCloseDelProductModal();
    } catch (error) {
      alert('刪除產品失敗');
    }
  }


  return (
    <>
      {isAuth ? (<div className="container py-5">
      <div className="row">
        <div className="col">
          <div className="d-flex justify-content-between">
            <h2>產品列表</h2>
            <button type="button" className="btn btn-info" onClick={()=> handleOpenProductModal('create')}>建立新的產品</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">產品名稱</th>
                <th scope="col">原價</th>
                <th scope="col">售價</th>
                <th scope="col">是否啟用</th>
                <th scope="col">編輯/刪除</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <th scope="row">{product.title}</th>
                  <td>{product.origin_price}</td>
                  <td>{product.price}</td>
                  <td>{product.is_enabled ? (<span className="text-success">啟用</span>) : <span>未啟用</span>}</td>
                  <td>
                    <div className="btn-group">
                      <button type="button" className="btn btn-outline-primary btn-sm" onClick={()=> handleOpenProductModal('edit', product)}>編輯</button>
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={()=>handleOpenDelProductModal(product)}>刪除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
      </div>
    </div>) :<div className="conatiner">
        <div className="row">
          <div className="col-8 m-auto">
            <div className="d-flex flex-column justify-content-center align-items-center vh-100">
              <h1 className="mb-5">請先登入</h1>
              <form onSubmit={login} className="d-flex flex-column gap-3" style={{width: '300px'}}>
                <div className="form-floating mb-3">
                  <input type="email" className="form-control" id="username" placeholder="name@example.com" value={user.username} name="username" onChange={handleUser} />
                  <label htmlFor="username">Email address</label>
                </div>
                <div className="form-floating">
                  <input type="password" className="form-control" id="password" placeholder="Password" value={user.password} name="password" onChange={handleUser}/>
                  <label htmlFor="password">Password</label>
                </div>
                <button className="btn btn-info">登入</button>
              </form>
              <p className="mt-5 mb-3 text-muted">&copy; 2025 ∞~ React 作品實戰 ~∞</p>
            </div>
          </div>
        </div>
      </div>
      }
      
      <div ref={productModalRef} id="productModal" className="modal" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content border-0 shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title fs-4">{modalMode === 'create' ? '新增產品' : '編輯產品'}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={handleCloseProductModal}></button>
            </div>

            <div className="modal-body p-4">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="mb-4">
                    <label htmlFor="primary-image" className="form-label">
                      主圖
                    </label>
                    <div className="input-group">
                      <input
                        value={tempProduct.imageUrl}
                        onChange={handleModalInputChange}
                        name="imageUrl"
                        type="text"
                        id="primary-image"
                        className="form-control"
                        placeholder="請輸入圖片連結"
                      />
                    </div>
                    <img
                      src={tempProduct.imageUrl}
                      alt={tempProduct.title}
                      className="img-fluid"
                    />
                  </div>

                  {/* 副圖 */}
                  <div className="border border-2 border-dashed rounded-3 p-3">
                    {tempProduct.imagesUrl?.map((image, index) => (
                      <div key={index} className="mb-2">
                        <label
                          htmlFor={`imagesUrl-${index + 1}`}
                          className="form-label"
                        >
                          副圖 {index + 1}
                        </label>
                        <input
                          value={image || ""}
                          onChange={(e) => handleImageChange(e, index)}
                          id={`imagesUrl-${index + 1}`}
                          type="text"
                          placeholder={`圖片網址 ${index + 1}`}
                          className="form-control mb-2"
                        />
                        {image && (
                          <img
                            src={image}
                            alt={`副圖 ${index + 1}`}
                            className="img-fluid mb-2"
                          />
                        )}
                      </div>
                    ))}
                    <div className="btn-group w-100">
                      {tempProduct.imagesUrl?.length < 5 && tempProduct.imagesUrl[tempProduct.imagesUrl.length - 1] !== '' && (
                        <button className="btn btn-outline-primary btn-sm w-100" onClick={handleAddImage}>新增圖片</button>
                      )}
                      {tempProduct.imagesUrl.length > 1 && (
                        <button className="btn btn-outline-danger btn-sm w-100" onClick={handleRemoveImage}>取消圖片</button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-md-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      標題
                    </label>
                    <input
                      value={tempProduct.title}
                      onChange={handleModalInputChange}
                      name="title"
                      id="title"
                      type="text"
                      className="form-control"
                      placeholder="請輸入標題"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="category" className="form-label">
                      分類
                    </label>
                    <input
                      value={tempProduct.category}
                      onChange={handleModalInputChange}
                      name="category"
                      id="category"
                      type="text"
                      className="form-control"
                      placeholder="請輸入分類"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="unit" className="form-label">
                      單位
                    </label>
                    <input
                      value={tempProduct.unit}
                      onChange={handleModalInputChange}
                      name="unit"
                      id="unit"
                      type="text"
                      className="form-control"
                      placeholder="請輸入單位"
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label htmlFor="origin_price" className="form-label">
                        原價
                      </label>
                      <input
                        value={tempProduct.origin_price}
                        onChange={handleModalInputChange}
                        name="origin_price"
                        id="origin_price"
                        type="number"
                        className="form-control"
                        placeholder="請輸入原價"
                      />
                    </div>
                    <div className="col-6">
                      <label htmlFor="price" className="form-label">
                        售價
                      </label>
                      <input
                        value={tempProduct.price}
                        onChange={handleModalInputChange}
                        name="price"
                        id="price"
                        type="number"
                        className="form-control"
                        placeholder="請輸入售價"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      產品描述
                    </label>
                    <textarea
                      value={tempProduct.description}
                      onChange={handleModalInputChange}
                      name="description"
                      id="description"
                      className="form-control"
                      rows={4}
                      placeholder="請輸入產品描述"
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">
                      說明內容
                    </label>
                    <textarea
                      value={tempProduct.content}
                      onChange={handleModalInputChange}
                      name="content"
                      id="content"
                      className="form-control"
                      rows={4}
                      placeholder="請輸入說明內容"
                    ></textarea>
                  </div>

                  <div className="form-check">
                    <input
                      checked={tempProduct.is_enabled}
                      onChange={handleModalInputChange}
                      name="is_enabled"
                      type="checkbox"
                      className="form-check-input"
                      id="isEnabled"
                    />
                    <label className="form-check-label" htmlFor="isEnabled">
                      是否啟用
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-top bg-light">
              <button type="button" className="btn btn-secondary" onClick={handleCloseProductModal}>
                取消
              </button>
              <button type="button" className="btn btn-primary" onClick={handleUpdateProduct}>
                確認
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={deleteProductModalRef}
        className="modal fade"
        id="delProductModal"
        tabIndex="-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5">刪除產品</h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={handleCloseDelProductModal}
              ></button>
            </div>
            <div className="modal-body">
              你是否要刪除 
              <span className="text-danger fw-bold">{tempProduct.title}</span>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseDelProductModal}
              >
                取消
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteProduct}>
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App

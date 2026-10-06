import { useEffect, useState } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext.jsx';
import { adminApi as api} from '../../../services/adminApi.js';

// ============================================================================
// SERVICIOS (API)
// ============================================================================
const crearProducto = (datos) => {
    const payload = { ...datos };
    ['id', 'modelo', 'marca', 'categoria'].forEach(k => delete payload[k]);
    return api.post('/api/productos', payload);
};
const actualizarProducto = (id, datos) => api.put(`/api/productos/${id}`, datos);
const eliminarProducto = (id) => api.delete(`/api/productos/${id}/hard`);


// ============================================================================
// CONSTANTES Y ESTADOS INICIALES
// ============================================================================
const INITIAL_FORM = {
    nombre: "", descripcion: "", categoriaId: "", categoria: "", precio: "",
    almacenamientoGb: "", stock: "", pesoG: "",
    modeloId: "", modelo: "", marcaId: "", marca: ""
};


// ============================================================================
// COMPONENTES UI REUTILIZABLES
// ============================================================================

const Mensaje = ({ error, exito }) => {
    if (!error && !exito) return null;
    const tipoClase = error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800';
    return <div className={`rounded-xl border p-4 text-sm font-medium mb-4 ${tipoClase}`}>{error || exito}</div>;
};

const CampoForm = ({ label, as: Tag = 'input', children, ...props }) => (
    <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
        <Tag {...props} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            {children}
        </Tag>
    </div>
);

const ModalForm = ({ modal, onChange, onAgregarNuevo, onSubmit, onClose, marcas, modelos, categorias }) => {
    if (!modal.abierto) return null;
    const { id, form } = modal;
    const modelosFiltrados = form.marcaId ? modelos.filter(m => m.marcaId == form.marcaId) : [];

    const handleSelectChange = (e, tipo) => {
        if (e.target.value === '__NUEVO__') {
            onAgregarNuevo(tipo);
        } else {
            onChange(e);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h3 className="text-lg font-bold">{id ? 'Editar' : 'Nuevo'} producto</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 text-2xl hover:text-slate-600">&times;</button>
                </div>
                <form onSubmit={onSubmit} className="p-6 grid gap-4 sm:grid-cols-2">
                    <CampoForm label="Nombre" name="nombre" value={form.nombre} onChange={onChange} required />
                    
                    <CampoForm label="Categoría" as="select" name="categoriaId" value={form.categoriaId} onChange={e => handleSelectChange(e, 'categoria')} required>
                        <option value="">Seleccionar...</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        <option value="__NUEVO__" className="font-semibold text-indigo-600">+ Agregar nueva categoría</option>
                    </CampoForm>

                    <CampoForm label="Marca" as="select" name="marcaId" value={form.marcaId} onChange={e => handleSelectChange(e, 'marca')} required>
                        <option value="">Seleccionar...</option>
                        {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        <option value="__NUEVO__" className="font-semibold text-indigo-600">+ Agregar nueva marca</option>
                    </CampoForm>

                    <CampoForm label="Modelo" as="select" name="modeloId" value={form.modeloId} onChange={e => handleSelectChange(e, 'modelo')} required>
                        <option value="">Seleccionar...</option>
                        {modelosFiltrados.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        <option value="__NUEVO__" className="font-semibold text-indigo-600">+ Agregar nuevo modelo</option>
                    </CampoForm>

                    <CampoForm label="Precio" type="number" name="precio" value={form.precio} onChange={onChange} required />
                    <CampoForm label="Stock" type="number" name="stock" value={form.stock} onChange={onChange} required />
                    
                    <CampoForm label="Almacenamiento (GB)" as="select" name="almacenamientoGb" value={form.almacenamientoGb} onChange={onChange} required>
                        <option value="">Seleccionar...</option>
                        {['32', '64', '128', '256', '512', '1024'].map(v => <option key={v} value={v}>{v} GB</option>)}
                    </CampoForm>
                    
                    <CampoForm label="Peso (g)" type="number" name="pesoG" value={form.pesoG} onChange={onChange} required />
                    
                    <div className="col-span-2">
                        <CampoForm label="Descripción" as="textarea" name="descripcion" value={form.descripcion} onChange={onChange} required={!id} />
                    </div>
                    
                    <div className="col-span-2 mt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-100">Cancelar</button>
                        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TablaProductos = ({ productos, puedeEscribir, onEdit, onDelete }) => (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm mt-6">
        <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700">
                <tr>
                    {['ID', 'Nombre', 'Marca', 'Modelo', 'Precio', 'Stock', 'Categoría', 'Acciones'].map(h => (
                        <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {!productos.length ? (
                    <tr><td colSpan="8" className="p-8 text-center text-slate-500">No hay productos registrados.</td></tr>
                ) : productos.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 text-slate-600">
                        <td className="px-4 py-3">{p.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{p.nombre}</td>
                        <td className="px-4 py-3">{p.marca || '-'}</td>
                        <td className="px-4 py-3">{p.modelo || '-'}</td>
                        <td className="px-4 py-3">${p.precio != null ? Number(p.precio).toFixed(2) : '-'}</td>
                        <td className="px-4 py-3">{p.stock || '-'}</td>
                        <td className="px-4 py-3">{p.categoria || '-'}</td>
                        <td className="px-4 py-3">
                            <button onClick={() => onEdit(p)} className="text-indigo-600 font-medium hover:bg-indigo-50 px-2 py-1 rounded">
                                Ver {puedeEscribir && '/ Editar'}
                            </button>
                            {puedeEscribir && (
                                <button onClick={() => onDelete(p.id)} className="text-red-600 font-medium hover:bg-red-50 px-2 py-1 rounded ml-1">
                                    Eliminar
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function AdminProductos() {
    const { puedeEscribir } = useAdminAuth();
    
    const [data, setData] = useState({ productos: [], marcas: [], modelos: [], categorias: [] });
    const [msj, setMsj] = useState({ error: '', exito: '' });
    const [cargando, setCargando] = useState(true);
    const [modal, setModal] = useState({ abierto: false, id: null, form: INITIAL_FORM });

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [productos, marcas, modelos, categorias] = await Promise.all([
                api.get('/api/productos').catch(() => []),
                api.get('/api/marcas').catch(() => []),
                api.get('/api/modelos').catch(() => []),
                api.get('/api/categorias').catch(() => [])
            ]);
            setData({ 
                productos: productos || [], 
                marcas: marcas || [], 
                modelos: modelos || [], 
                categorias: categorias || [] 
            });
        } catch (err) {
            setMsj({ error: err.message || 'Error al cargar los datos.', exito: '' });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarDatos(); }, [puedeEscribir]);

    const abrirModal = (prod = null) => {
        setModal({ abierto: true, id: prod?.id || null, form: prod ? { ...INITIAL_FORM, ...prod } : INITIAL_FORM });
        setMsj({ error: '', exito: '' });
    };

    const cerrarModal = () => setModal({ abierto: false, id: null, form: INITIAL_FORM });

    const handleChange = (e) => setModal(m => ({ ...m, form: { ...m.form, [e.target.name]: e.target.value } }));

    const handleAgregarNuevo = async (tipo) => {
        if (tipo === 'modelo' && !modal.form.marcaId) {
            alert('Por favor, selecciona primero una marca para poder agregar un modelo.');
            return;
        }

        const nombre = window.prompt(`Ingrese el nombre de la nueva ${tipo}:`);
        if (!nombre?.trim()) return;

        const endpoints = {
            categoria: '/api/categorias',
            marca: '/api/marcas',
            modelo: '/api/modelos'
        };

        const payload = tipo === 'modelo' 
            ? { nombre: nombre.trim(), marcaId: modal.form.marcaId }
            : { nombre: nombre.trim() };

        try {
            const nuevaEntidad = await api.post(endpoints[tipo], payload);
            await cargarDatos();
            
            // Selecciona automáticamente la entidad recién creada en el formulario
            if (nuevaEntidad?.id) {
                setModal(m => ({
                    ...m,
                    form: { ...m.form, [`${tipo}Id`]: nuevaEntidad.id }
                }));
            }
        } catch (err) {
            setMsj({ error: err.message || `Error al crear ${tipo}.`, exito: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsj({ error: '', exito: '' });
        try {
            modal.id ? await actualizarProducto(modal.id, modal.form) : await crearProducto(modal.form);
            setMsj({ error: '', exito: `Producto ${modal.id ? 'actualizado' : 'creado'} con éxito.` });
            cerrarModal();
            cargarDatos();
        } catch (err) {
            setMsj({ error: err.message || 'Error al guardar.', exito: '' });
        }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
        try {
            await eliminarProducto(id);
            setMsj({ error: '', exito: 'Producto eliminado correctamente.' });
            cargarDatos();
        } catch (err) {
            setMsj({ error: err.message || 'Error al eliminar.', exito: '' });
        }
    };

    if (cargando) return <div className="flex min-h-[40vh] items-center justify-center text-slate-500 font-medium">Cargando Productos...</div>;

      if (cargando) {
        return <div className="flex min-h-[40vh] items-center justify-center text-slate-500 font-medium">Cargando Productos...</div>;
    }

    return (
        <div>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Productos</h2>
                    <p className="text-sm text-slate-600">
                        {puedeEscribir ? 'Gestioná los productos del panel.' : 'Vista de solo lectura del listado.'}
                    </p>
                </div>
                {puedeEscribir && (
                    <button onClick={() => abrirModal()} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500">
                        + Nuevo producto
                    </button>
                )}
            </div>

            <Mensaje error={msj.error} exito={msj.exito} />

            <TablaProductos 
                productos={data.productos} 
                puedeEscribir={puedeEscribir} 
                onEdit={abrirModal} 
                onDelete={handleEliminar} 
            />

            <ModalForm 
                modal={modal} 
                marcas={data.marcas} 
                modelos={data.modelos}
                categorias={data.categorias}
                onChange={handleChange} 
                onAgregarNuevo={handleAgregarNuevo}
                onSubmit={handleSubmit} 
                onClose={cerrarModal} 
            />
        </div>
    );
}
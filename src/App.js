import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import './App.css';
import logo from './logo.png';

// Configuración de Axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const App = () => {
  const [codigo, setCodigo] = useState('');
  const [turno, setTurno] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [registros, setRegistros] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(false);
  const [turnoActivo, setTurnoActivo] = useState(false);

  // Cargar registros automáticamente cuando el turno está activo
  useEffect(() => {
    let intervalId;
    if (turnoActivo && turnoSeleccionado) {
      cargarRegistros();
      intervalId = setInterval(cargarRegistros, 2000); // Actualiza cada 2 segundos
    }
    return () => clearInterval(intervalId);
  }, [turnoActivo, turnoSeleccionado, turno]);

  const cargarRegistros = async () => {
    try {
      const response = await axios.get('/registros', {
        params: { turno },
        timeout: 5000
      });
      setRegistros(response.data);
    } catch (err) {
      console.error('Error al cargar registros:', err);
      setError('No se pudieron cargar los registros. Verifica la conexión.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const registrarEmpleado = async () => {
    if (!turnoActivo) {
      setError('El turno no está activo');
      return setTimeout(() => setError(''), 3000);
    }

    if (!codigo.trim()) {
      setError('Ingrese el código del empleado');
      return setTimeout(() => setError(''), 3000);
    }

    try {
      const response = await axios.post('/registrar', { codigo, turno });
      setMensaje(response.data.message);
      setCodigo('');
      cargarRegistros(); // Actualizar lista inmediatamente
      setTimeout(() => setMensaje(''), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar');
      setTimeout(() => setError(''), 3000);
    }
  };

  const controlTurno = () => {
    if (!turnoSeleccionado) {
      setError('Seleccione un turno primero');
      return setTimeout(() => setError(''), 3000);
    }
    setTurnoActivo(!turnoActivo);
    setMensaje(`Turno ${!turnoActivo ? 'iniciado' : 'finalizado'}`);
    setTimeout(() => setMensaje(''), 2000);
  };

  const exportarExcel = async () => {
    try {
      const response = await axios.get('/exportar', {
        responseType: 'blob',
        params: { turno }
      });
      saveAs(new Blob([response.data]), `registros_${turno}.xlsx`);
    } catch (err) {
      setError('Error al exportar datos');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="App">
      <div className="logo-container">
        <img src={logo} alt="Logo Comedor San Martín" className="logo" />
      </div>

      <h1>{process.env.REACT_APP_TITULO}</h1>

      {!turnoSeleccionado ? (
        <div className="seleccion-turno">
          <h2>Seleccione Turno</h2>
          <select
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
          >
            <option value="">-- Seleccione --</option>
            <option value="desayuno">Desayuno</option>
            <option value="comida">Comida</option>
            <option value="cena">Cena</option>
          </select>
          <button 
            onClick={() => turno ? setTurnoSeleccionado(true) : setError('Seleccione turno')}
          >
            Confirmar
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      ) : (
        <div className="registro-empleados">
          <div className="control-turno">
            <button 
              onClick={controlTurno}
              className={turnoActivo ? 'btn-terminar' : 'btn-iniciar'}
            >
              {turnoActivo ? 'Terminar Turno' : 'Iniciar Turno'}
            </button>
            <span className="info-turno">Turno: {turno}</span>
          </div>

          <div className="registro-form">
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && registrarEmpleado()}
              placeholder="Código del empleado"
              disabled={!turnoActivo}
              autoFocus
            />
            <button 
              onClick={registrarEmpleado}
              disabled={!turnoActivo}
            >
              Registrar
            </button>
          </div>

          {mensaje && <p className="success">{mensaje}</p>}
          {error && <p className="error">{error}</p>}

          <div className="lista-registros">
            <h3>Registros del turno:</h3>
            {registros.length > 0 ? (
              <ul>
                {registros.map((registro) => (
                  <li key={registro.id}>
                    <span className="codigo">{registro.codigo}</span>
                    <span className="hora">{registro.hora}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sin-registros">
                {turnoActivo ? 'No hay registros aún' : 'Turno inactivo'}
              </p>
            )}
          </div>

          <button 
            onClick={exportarExcel} 
            className="btn-exportar"
            disabled={!turnoSeleccionado}
          >
            Exportar a Excel
          </button>
        </div>
      )}

      {/* Solo muestra en desarrollo */}
      {process.env.REACT_APP_MODO_DEBUG === 'true' && (
        <div className="debug-info">
          <p>Conectado a: {axios.defaults.baseURL}</p>
        </div>
      )}
    </div>
  );
};

export default App;
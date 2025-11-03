import React, { useEffect, useState } from 'react';
import { Typography, Container, Paper, Grid, CircularProgress, Alert, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

// Importamos Chart.js y los componentes de Pie
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Registramos los componentes necesarios para Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// Tipos de datos que esperamos de nuestra RPC
type StatRow = {
  count: string; // Supabase devuelve count como string
  [key: string]: string; // 'category' o 'status'
};
type StatsData = {
  by_category: StatRow[];
  by_status: StatRow[];
};
type ChartData = {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
};

// Paleta de colores para los gráficos
const CHART_COLORS = [
  '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', 
  '#858796', '#5a5c69', '#f8f9fc', '#d1d3e2', '#4e73df'
];
const CHART_BORDERS = CHART_COLORS.map(color => `${color}B3`); // Con opacidad

// Función para transformar los datos de Supabase al formato de Chart.js
const generateChartData = (data: StatRow[], labelKey: string, title: string): ChartData => {
  const labels = data.map(row => row[labelKey]);
  const counts = data.map(row => Number(row.count));

  return {
    labels: labels,
    datasets: [
      {
        data: counts,
        backgroundColor: CHART_COLORS.slice(0, data.length),
        borderColor: CHART_BORDERS.slice(0, data.length),
        borderWidth: 1,
      },
    ],
  };
};

const OverviewPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryData, setCategoryData] = useState<ChartData | null>(null);
  const [statusData, setStatusData] = useState<ChartData | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_overview_stats');
        
        if (error) throw error;

        const stats = data as StatsData;
        
        setCategoryData(generateChartData(stats.by_category, 'category', 'Incidencias por Categoría'));
        setStatusData(generateChartData(stats.by_status, 'status', 'Incidencias por Estado'));
        
      } catch (err: any) {
        setError(err.message || 'Error al cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        {/* --- BIENVENIDA --- */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              ¡Bienvenido, {user?.name}!
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Panel de Control del Sistema de Gestión de Incidencias (SGIU)
            </Typography>
          </Paper>
        </Grid>

        {/* --- GRÁFICOS --- */}
        {loading ? (
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Grid>
        ) : error ? (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        ) : (
          <>
            {/* Gráfico 1: Por Categoría */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" align="center" gutterBottom>
                  Incidencias por Categoría
                </Typography>
                <Box sx={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {categoryData && categoryData.labels.length > 0 ? (
                    <Pie data={categoryData} options={{ responsive: true, maintainAspectRatio: false }} />
                  ) : (
                    <Typography>No hay datos de categorías.</Typography>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Gráfico 2: Por Estado */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" align="center" gutterBottom>
                  Incidencias por Estado
                </Typography>
                <Box sx={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {statusData && statusData.labels.length > 0 ? (
                    <Pie data={statusData} options={{ responsive: true, maintainAspectRatio: false }} />
                  ) : (
                    <Typography>No hay datos de estados.</Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
};

export default OverviewPage;
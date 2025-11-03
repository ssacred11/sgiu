import { supabase } from '../supabaseClient'; // <-- Importamos supabase

const fetchIncidents = async () => {
  // Llamamos a la FUNCIÓN RPC que creamos para los admins
  const { data, error } = await supabase.rpc('get_all_incidents_with_details'); 
  if (error) console.error(error);
  else setIncidents(data);
}

const handleUpdateStatus = async (id, newStatus) => {
  // Actualizamos la tabla 'incidents' directamente
  const { error } = await supabase
    .from('incidents')
    .update({ status: newStatus })
    .eq('id', id);
}

const handleDelete = async (id) => {
  // Borramos de la tabla 'incidents' directamente
  const { error } = await supabase
    .from('incidents')
    .delete()
    .eq('id', id);
}
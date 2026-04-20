import api from './api'

export const patientService = {
  // Lister les patients
  getAll: (page = 1, limit = 10, search = '', sexe = '') =>
    api.get('/patients/', { params: { page, limit, search, sexe } }),

  // Un seul patient
  getById: (id) =>
    api.get(`/patients/${id}`),

  // Créer un patient
  create: (data) =>
    api.post('/patients/', data),

  // Modifier un patient
  update: (id, data) =>
    api.put(`/patients/${id}`, data),

  // Archiver un patient
  archive: (id) =>
    api.put(`/patients/${id}/archive`),

  // Lister les patients archivés
  getArchived: (page = 1, limit = 10, search = '', sexe = '') => {
    // Convertir les paramètres pour éviter les problèmes
    const params = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search: search && search.trim() ? search.trim() : undefined,
      sexe: sexe && sexe.trim() ? sexe.trim() : undefined
    }
    return api.get('/patients/archived', { params })
  },

  // Supprimer un patient (non utilisé)
  delete: (id) =>
    api.delete(`/patients/${id}`),

  // Visites d'un patient
  getVisites: (patientId, page = 1) =>
    api.get(`/patients/${patientId}/visites`, { params: { page } }),

  // Créer une visite
  createVisite: (patientId, data) =>
    api.post(`/patients/${patientId}/visites`, data),

  // IRM d'un patient
  getIRM: (patientId) =>
    api.get(`/patients/${patientId}/irm`),

  // Uploader une IRM
  uploadIRM: (patientId, formData, sequenceType) =>
    api.post(`/patients/${patientId}/irm?sequence_type=${sequenceType}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
}
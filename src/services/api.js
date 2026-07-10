import axios from "axios";
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
    timeout: 10000,
});

export const yieldAPI = {
    predict: (params) => api.get("/yield/predict", { params }),
    history: (regionId) => api.get(`/yield/history/${regionId}`),
};

export const demandAPI = {
    forecast: (cropId, months) => api.get("/demand/forecast",
        { params: { cropId, months } }),
    gap: (regionId) => api.get("/demand/gap", { params: { regionId } }),
};

export const advisoryAPI = {
    get: (farmerId) => api.get(`/advisory/${farmerId}`),
};
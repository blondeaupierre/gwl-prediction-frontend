import axios from "axios";

const API_URL = "http://localhost:8000";


export function getWells() {
    return axios.get(`${API_URL}/wells`);
}

export function getHistory(wellId: string) {
    return axios.get(
        `${API_URL}/wells/${encodeURIComponent(wellId)}/history`
    );
}

export function getTestResultsXGB(wellId: string) {
    return axios.get(
        `${API_URL}/wells/${encodeURIComponent(wellId)}/test/xgb`
    );
}

export function getTestResultsTabIclZeroShot(wellId: string) {
    return axios.get(
        `${API_URL}/wells/${encodeURIComponent(wellId)}/test/tabicl/zero-shot`
    );
}

export function getForecastXGB(wellId: string) {
    return axios.get(
        `${API_URL}/wells/${encodeURIComponent(wellId)}/forecast/xgb`
    );
}

export function getForecastTabIclZeroShot(wellId: string) {
    return axios.get(
        `${API_URL}/wells/${encodeURIComponent(wellId)}/forecast/tabicl/zero-shot`
    );
}
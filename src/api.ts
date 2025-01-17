import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('API URL not configured. Please set VITE_API_URL in your .env file.');
}

export const initializeDb = () => axios.post(`${API_URL}/init`);

export const getEmployees = async () => {
  const response = await axios.get(`${API_URL}/employees`);
  return response.data.map((emp: any) => ({
    ...emp,
    overtimeHours: emp.overtime_hours
  }));
};

export const addEmployee = (employee: {
  id: string;
  name: string;
  position: string;
  department: string;
  overtimeHours: number;
}) => axios.post(`${API_URL}/employees`, employee);

export const updateEmployeeOvertime = (id: string, hours: number) =>
  axios.put(`${API_URL}/employees/${id}/overtime`, { hours });
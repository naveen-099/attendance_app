import { Platform } from 'react-native';

export type LoginUser = {
  employee_id?: string;
  role?: string;
  full_name?: string;
  is_first_login_required?: boolean;
};

export type LoginResponse = {
  success: boolean;
  data?: {
    token?: string;
    user?: LoginUser;
    require_password_change?: boolean;
    message?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
};

export type EmployeeCreateRequest = {
  full_name: string;
  email: string;
  phone: string;
  department?: string;
  designation?: string;
};

export type EmployeeCreateResponse = {
  employee_id: string;
  temporary_password: string;
  message: string;
};

export type PasswordChangeResponse = {
  message: string;
  first_login_completed: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const API_BASE_URL = (() => {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/$/, '');
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080';
  }

  return 'http://localhost:8080';
})();

export async function loginWithEmployeeId(
  employeeId: string,
  password: string,
): Promise<LoginResponse> {
  return request<LoginResponse['data']>(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      employee_id: employeeId.trim(),
      password,
    }),
  }).then((data) => ({ success: true, data }));
}

export async function getCurrentUser(token: string): Promise<LoginUser> {
  const data = await request<{ user: LoginUser }>(`${API_BASE_URL}/api/v1/auth/me`, {
    method: 'GET',
    token,
  });
  return data.user;
}

export async function changePassword(
  employeeId: string,
  oldPassword: string,
  newPassword: string,
  confirmPassword: string,
  token: string,
): Promise<PasswordChangeResponse> {
  return request<PasswordChangeResponse>(`${API_BASE_URL}/api/v1/auth/change-password`, {
    method: 'POST',
    token,
    body: JSON.stringify({
      employee_id: employeeId,
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });
}

export async function createEmployee(
  employee: EmployeeCreateRequest,
  token: string,
): Promise<EmployeeCreateResponse> {
  const data = await request<EmployeeCreateResponse>(`${API_BASE_URL}/api/v1/admin/employees`, {
    method: 'POST',
    token,
    body: JSON.stringify(employee),
  });

  if (!data?.employee_id || !data.temporary_password) {
    throw new Error('The server response did not include the generated employee credentials.');
  }

  return data;
}

async function request<T>(
  url: string,
  options: { method: 'GET' | 'POST'; body?: string; token?: string },
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: options.method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body ? { body: options.body } : {}),
    });
    const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

    if (!response.ok || payload.success === false) {
      throw new ApiError(
        payload.error?.message || `Request failed with status ${response.status}.`,
        response.status,
        payload.error?.code,
      );
    }

    if (payload.data === undefined) {
      throw new Error('The server returned an unexpected response.');
    }

    return payload.data;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The request timed out. Check your connection and try again.');
    }
    if (error instanceof TypeError) {
      throw new Error('Could not reach the attendance server. Check the API URL and connection.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

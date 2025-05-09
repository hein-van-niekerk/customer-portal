export const loginUser = async (email, password) => {
  try {
    const response = await fetch('https://localhost:3001/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Allow cookies to be included
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 403) {
        alert(data.error); // Account is locked
        throw new Error(data.error);
      }
      throw new Error(data.error || 'Login failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

const express = require('express');
const argon2 = require('argon2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let users = [
  {
    email: "user@example.com",
    password: "$argon2id$v=19$m=65536,t=3,p=1$HcKMAnyq1qTb7KCEiZzh0g$pXzbUqzbdmLasQlJNBk8Yt7hM9HnHAFFuyn5YiDfzYc" // password: "secure123"
  }
];

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ success: true, email });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
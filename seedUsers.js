import mongoose from 'mongoose';
import { hash } from 'argon2';

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const User = mongoose.model('User', userSchema);

await mongoose.connect('mongodb://localhost:27017/authdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const users = [
  { email: 'alice@example.com', password: 'Password123' },
  { email: 'bob@example.com', password: 'Secure456' },
  { email: 'carol@example.com', password: 'Pass789word' },
  { email: 'dan@example.com', password: 'Qwerty123' },
  { email: 'eve@example.com', password: 'Test1234' },
];

for (const user of users) {
  const hashedPassword = await hash(user.password);
  await User.create({ email: user.email, password: hashedPassword });
  console.log(`✔️ Added user: ${user.email}`);
}

mongoose.disconnect();

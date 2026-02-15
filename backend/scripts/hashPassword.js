const bcrypt = require('bcryptjs');

// The password you want to hash
const password = 'Golonzo123#11';

// Generate hash
bcrypt.genSalt(10, (err, salt) => {
  if (err) {
    console.error('Error generating salt:', err);
    process.exit(1);
  }
  
  bcrypt.hash(password, salt, (err, hash) => {
    if (err) {
      console.error('Error hashing password:', err);
      process.exit(1);
    }
    
    console.log('Password:', password);
    console.log('Hashed password:', hash);
    console.log('\nCopy the hashed password above and update it in MongoDB Atlas');
    process.exit(0);
  });
});

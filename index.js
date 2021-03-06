const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('./data/dbConfig.js');

const server = express();

server.use(express.json());
server.use(cors());

server.get('/', (req, res) => {
  res.send('Welcome!');
});

server.post('/api/register', (req, res) => {
  const creds = req.body;

  const hash = bcrypt.hashSync(creds.password, 10);
  creds.password = hash;

  db('users')
    .insert(creds)
    .then(ids => {
      const id = ids[0];
      res
        .status(201)
        .json({ newUserId: id });
    })
    .catch(err => {
      res
        .status(500)
        .json(err);
    });
});


const jwtSecret = 'that/s.my.secret.Cap,I/m.always.angry';

function generateToken(user) {
  const jwtPayload = {
    ...user,
    roles: ['admin', 'root'],
  };
  const jwtOptions = {
    expiresIn: '1m',
  };
  
  return jwt.sign(jwtPayload, jwtSecret, jwtOptions);
}

server.post('/api/login', (req, res) => {
  const creds = req.body;

  db('users')
    .where({ username: creds.username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(creds.password, user.password)) {
        const token = generateToken(user);
        res
          .status(200)
          .json({
            welcome: user.username, department: user.department, token
          });
      } else {
        res
          .status(401)
          .json({ message: 'Nope.' })
      }
    })
})

server.get('/api/users', protected, (req, res) => {
  db('users')
    .select('id', 'username', 'password', 'department')
    .then(users => {
      res.json({ users });
    })
    .catch(err => res.send(err));
})

function protected(req, res, next) {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, jwtSecret, (err, decodedToken) => {
      if (err) {
        // token verif failed
        res.status(401).json({ message: 'Invalid Token' });
      } else {
        // token valid
        req.decodedToken = decodedToken;
        console.log('\n== decodedToken info ==\n', req.decodedToken);
        next();
      }
    });
  } else {
    res.status(401).json({ message: 'No token provided.' });
  }
}

port = 3300;
server.listen(port, () => console.log(`\n= = Running on port ${port} = =\n`))
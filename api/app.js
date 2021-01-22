const express = require('express');
const app = express();

const { mongoose } = require('./db/mongoose');

const bodyParser = require('body-parser');

const { List, Task, User } = require('./db/models');

app.use(bodyParser.json());


app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "YOUR-DOMAIN.TLD"); // update to match the domain you will make the request from
    res.header("Access=Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

let verifySession = (req, res, next) => {
    let refreshToken = req.header('x-header-token');
    let _id = req.header('_id');

    User.findByIdAndToken(_id, token).then((user) => {
        if (!user) {
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            });
        }

        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    isSessionValid = true;
                }
            }
        });

        if (isSessionValid) {
            next();
        } else {
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }

    }).catch((e) => {
        res.status(401).send(e);
    })
}

// app.use((req, res, next) => {
//     let refreshToken = req.header('x-header-token');
//     let _id = req.header('_id');

//     User.findByIdAndToken(_id, token).then((user) => {
//         if (!user) {
//             return Promise.reject({
//                 'error': 'User not found. Make sure that the refresh token and user id are correct'
//             });
//         }

//         req.user_id = user._id;
//         req.refreshToken = refreshToken;

//         let isSessionValid = false;

//         user.sessions.forEach((session) => {
//             if (session.token === refreshToken) {
//                 if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
//                     isSessionValid = true;
//                 }
//             }
//         });

//         if (isSessionValid) {
//             next();
//         } else {
//             return Promise.reject({
//                 'error': 'Refresh token has expired or the session is invalid'
//             })
//         }

//     }).catch((e) => {
//         res.status(401).send(e);
//     })
// });


app.get('/lists', (req, res) => {
    List.find({}).then((lists) => {
        res.send(lists);
    })
})

app.post('/lists', (req, res) => {
    let title = req.body.title;
    let newList = new List({
        title
    });
    newList.save().then((listDoc) => {
        response.send(listDoc);
    })
})

app.patch('/lists/:id', (req, res) => {
    List.findOneAndUpdate({ _id: req.params.id }, {
        $set: req.body
    }).then(() => {
        res.sendStatus(200);
    });
});

app.delete('/lists/:id', (req, res) => {
    List.findOneAndRemove({
        _id: req.params.id
    }).then((removeListDoc) => {
        res.send(removedListDoc);
    })
});

app.get('/lists/:listId/tasks', (req, res) => {
    Task.find({
        _listId: req.params.listId
    }).then((tasks) => {
        res.send(tasks);
    })
});

app.get('/lists/:listId/tasks/:taskId', (req, res) => {
    Task.findOne({
        _id: req.params.taskId,
        _listId: req.params.listId
    }).then((task) => {
        res.send(task);
    })
})

app.post('/lists/:listId/tasks', (req, res) => {
    let newTask = new Task({
        title: req.body.title,
        _listId: req.params.listId
    });
    newTask.save().then((newTaskDoc) => {
        res.send(newTaskDoc);
    })
})

app.patch('/lists/:listId/tasks/:taskId', (req, res) => {
    Task.findOneAndUpdate({
        _id: req.params.taskId,
        _listId: req.params.listId
    }, {
        $set: req.body
    }
    ).then(() => {
        res.send({ message: 'Updated successfully.' });
    })
});

app.delete('/lists/:listId/tasks/:taskId', (req, res) => {
    Task.findOneAndRemove({
        _id: req.params.taskId,
        _listId: req.params.listId
    }).then((removedTaskDoc) => {
        res.send(removedTaskDoc);
    })
})


app.post('/users', (req, res) => {
    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        return newUser.generateAccessAuthToken().then((accessToken) => {
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
        res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
})


app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            return user.generateAccessAuthToken().then((accessToken) => {
                return { accessToken, refreshToken }
            });
        }).then((authTokens) => {
            res
                .header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
})

app.get('users/me/access-token', verifySession, (req, res) => {
    req.userObject.generateAccessAuthToken.then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})

app.listen(3000, () => {
    console.log("Server is listening on port 3000");
})
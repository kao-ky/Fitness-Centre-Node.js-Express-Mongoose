# Fitness-app
Full Stack Course

## Schemas

### User
```javascript
User = {
	"primary-key": "akuh2398sv3s",
	"email": "xxx@email.com",
	"password": "hash",
	"type": "customer"						//or "admin"
	"subscription": true,
	"transactions": [],						//paid
	"cart": [],								//wishlist
}
```

### Lesson
```javascript
Lesson = {
	"primary-key": "1228cshe0s3k",
	"name": "lesson-name",
	"photo": "/images/lesson-name.jpg",
	"duration": 180, 						//mins
	"cost": 135,							//30 * 0.75
	"instructor": "Peter",
}
```

### Transaction
```javascript
Transaction = {
	"primary-key": "1jd830sx08l3",
	"name": "Yeung",
	"confirmation-number": "124902847103",
	"date": "2023-02-09",
	"lessons": [],
	"total": 75.00,
	"tax": 0.00,							//tax != revenue (total)
}
```

### Cart
```javascript
Cart = {
	"primary-key": "5j0f0lo28k9c",
	"lessons": [],	
}
```

## APIs
- [ ]   **"/"**                     `GET`     "*Home-page"
- [ ]   **"/lessons"**              `GET`     "*Lesson-page (Already registered?)"
- [ ]   **"/cart"**                 `GET`     "*Cart-page"
- [ ]   **"/cart/:lesson-id"**      `PATCH`   "Add Lesson"
- [ ]   **"/cart/:lesson-id"**      `Delete`   "Delete Lesson"
- [ ]   **"/transaction"**          `POST`    "Create transaction (a success message and randomly generated confirmation number.)"    
- [ ]   **"/login"**                `GET`     "Login-register-page"
- [ ]   **"/login"**                `POST`    "Validate email"
- [ ]   **"/register"**             `POST`    "Create user (Check duplication)"
- [ ]   **"/register"**             `PATCH`   "Update user (subscription)"
- [ ]   **"/admin"**                `GET`     "Admin-page (with query string)" 
- [ ]   **"/"**                     `*`       "Error-page"  

## Views
 - [ ] "header"			//partials
 - [ ] "footer"			//partials
 - [ ] "home"
 - [ ] "lessons"
 - [ ] "lesson"			//partials - single lesson
 - [ ] "cart"				//non logged-in user: hide purchase button && show log-in required message
 - [ ] "login-register"
 - [ ] "admin"
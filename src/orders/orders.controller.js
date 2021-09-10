const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Function used to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//Function to determine if an order exists when a user tries to access a specific order at route at /orders/:orderId
function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    //If the foundOrder variable is not empty the order is stored in locals to be utilized by the next middleware function.
    if (foundOrder) {
        res.locals.order = foundOrder;
        next();
    }
    //If the order is not found, and the foundOrder property is empty, and error messge is sent to the user.
    next({
        status: 404,
        message: `Order with ID of ${orderId} not found.`
    })
}

//Function used to verify if the user has provided all of the request body information, and that it's in the proper format.
function validateOrderBody(req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes } } = req.body;

    //If the deliverTo property doesn't exist, or if the deliverTo property is an empty string, return an error message.
    if (!deliverTo || deliverTo === "") {
        next({
            status: 400,
            message: "Order must include a deliverTo"
        })
    }
    //If the mobileNumber property doesn't exist, or if the mobileNumber property is an empty string, return an error message.
    if (!mobileNumber || mobileNumber === "") {
        next({
            status: 400,
            message: "Order must include a mobileNumber"
        })
    }
    //If the dishes property doesn't exist, isn't an array, or the array is empty return an error message.
    if (!dishes || !Array.isArray(dishes) || !dishes.length) {
        next({
            status: 400,
            message: "Order must include at least one dish"
        })
    }
    //Storing the dishes property in locals for use in the validateDishes function, then moving on to the next middleware function.
    res.locals.dishes = dishes;
    next();
}

//Function to validate the dishes property within the request body has all of the required properties and they're formatted properly.
function validateDishes(req, res, next) {
    //badDishes creates an array of the indexes for any dishes that don't have a quantity property, the quantity property isn't a number, or the quantity is less than or equal to zero.
    const badDishes = res.locals.dishes.reduce((badDishesArray, currentDish, index) => {
        if (!currentDish.quantity || typeof (currentDish.quantity) !== "number" || currentDish.quantity <= 0) {
            badDishesArray.push(index)
        }
        return badDishesArray
    }, [])

    //If the badDishes array has any entries an error message is sent notifying the user of the error dish's index.
    if (badDishes.length) {
        const index = badDishes[0]
        next({
            status: 400,
            message: `Dish ${index} must have a quantity that is an integer greater than 0`
        })
    }
    next()
}

//Function to handle when a user makes a post request to the /orders route.
function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    //A new object is being created with the request body properties and also adds an id property.
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes,
    }

    //Pushing the new order to the orders database and replying to the user with the new order data.
    orders.push(newOrder)
    res.status(201).json({ data: newOrder })
}

//A function for when a user makes a get request to a /orders/:orderId route.
function read(req, res) {
    res.json({ data: res.locals.order })
}

//Function to validate if the put request body status property is a valid property to allow an update.  It also checks to see if the order id exists.  If it does, it verifies that the orderId in the url matches the id of the order.
function validateUpdateInformation(req, res, next) {
    const { orderId } = req.params;
    const { data: { id, status } = {} } = req.body;
    const validStatuses = ['pending', 'preparing', 'out-for-delivery', 'delivered']

    //The id property isn't required, but if it does exist a check has to be made to make sure the order's id matches the orderId found in the request params.
    if (id && orderId !== id) {
        next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
        })
    }

    //Checking to make sure the order has a status property, the status property isn't blank, and only includes one of the four valid order statuses allowed.  If any of those conditions exist an error message is sent to the user.
    if (!status || status === "" || !validStatuses.includes(status)) {
        next({
            status: 400,
            message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
        })
    }

    //An order with a status of delivered can't be updated.  This check verifies the status doesn't shows as "delivered".  If it does the user is sent an error message.
    if (status === "delivered") {
        next({
            status: 400,
            message: "A delivered order cannot be changed"
        })
    }
    next()
}

//Function to update an order's information when a user sends a put request to the /orders/:orderId route.
function update(req, res) {
    //Utilizing the order information stored in locals from the orderExists function.
    const orderInfo = res.locals.order;
    const { data: { id, deliverTo, mobileNumber, dishes } = {} } = req.body;

    //Checking to see if the properties values in the order stored in locals from the orderExists function match the request body property values.  If they all match no change is made.  If any of the properties don't match the order will be updated with the new property values.
    if (orderInfo.id !== id || orderInfo.deliverTo !== deliverTo || orderInfo.mobileNumber !== mobileNumber || orderInfo.dishes !== dishes) {
        orderInfo.deliverTo = deliverTo,
            orderInfo.mobileNumber = mobileNumber,
            orderInfo.dishes = dishes
    }
    res.json({ data: orderInfo });
}

//Function to delete an order when the customer sends a delete request to the orders/:orderId route.
function deleteOrder(req, res, next) {
    const { orderId } = req.params;
    const index = orders.findIndex(order => orderId === order.id);
    //Utilizing the status property from the order information stored in locals from the orderExists function.
    const { status } = res.locals.order
    if (status !== "pending") {
        next({
            status: 400,
            message: "An order cannot be deleted unless it is pending"
        })
    }
    const deletedOrder = orders.splice(index, 1);
    res.sendStatus(204);
}

//Function to show all orders in the database when a get request is sent to the /orders route.
function list(req, res) {
    res.json({ data: orders })
}

module.exports = {
    create: [validateOrderBody, validateDishes, create],
    read: [orderExists, read],
    update: [orderExists, validateOrderBody, validateDishes, validateUpdateInformation, update],
    deleteOrder: [orderExists, deleteOrder],
    list: [list],
}
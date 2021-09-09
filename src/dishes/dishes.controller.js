const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        next();
    }
    next({
        status: 404,
        message: `Order with ID of ${orderId} not found.`
    })
}

function validateOrderBody(req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes } } = req.body;

    if (!deliverTo || deliverTo === "") {
        next({
            status: 400,
            message: "Order must include a deliverTo"
        })
    }
    if (!mobileNumber || mobileNumber === "") {
        next({
            status: 400,
            message: "Order must include a mobileNumber"
        })
    }
    if (!dishes || !Array.isArray(dishes) || !dishes.length) {
        next({
            status: 400,
            message: "Order must include at least one dish"
        })
    }
    next()
}

function validateDishes(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    const badDishes = dishes.reduce((badDishesArray, currentDish, index) => {
        if (!currentDish.quantity || typeof (currentDish.quantity) !== "number" || currentDish.quantity <= 0) {
            badDishesArray.push(index)
        }
        return badDishesArray
    }, [])

    if (badDishes.length) {
        const index = badDishes[0]
        next({
            status: 400,
            message: `Dish ${index} must have a quantity that is an integer greater than 0`
        })
    }
    next()
}


function create(req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes,
    }
    dishes.push(newOrder)
    res.status(201).json({ data: newOrder })
}


function read(req, res, next) {
    res.json({ data: res.locals.order })
}

function validateUpdateInformation(req, res, next) {
    const { orderId } = req.params;
    const { data: { id, status } = {} } = req.body;
    const validStatuses = ['pending', 'preparing', 'out-for-delivery', 'delivered']
    if (id && orderId !== id) {
        next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
        })
    }
    if (!status || status === "" || !validStatuses.includes(status)) {
        next({
            status: 400,
            message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
        })
    }
    if (status === "delivered") {
        next({
            status: 400,
            message: "A delivered order cannot be changed"
        })
    }
    next()
}

function update(req, res, next) {
    const orderInfo = res.locals.order;
    const { data: { id, deliverTo, mobileNumber, dishes } = {} } = req.body;

    if (orderInfo.id !== id || orderInfo.deliverTo !== deliverTo || orderInfo.mobileNumber !== mobileNumber || orderInfo.dishes !== dishes) {
        orderInfo.deliverTo = deliverTo,
            orderInfo.mobileNumber = mobileNumber,
            orderInfo.dishes = dishes
    }
    res.json({ data: orderInfo });
}

function deleteOrder(req, res, next) {
    const { orderId } = req.params;
    const index = orders.findIndex(order => orderId === order.id);
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

function list(req, res) {
    res.json({ data: orders })
}

module.exports = {
    create: [validateOrderBody, validateDishes, create],
    read: [orderExists, read],
    update: [orderExists, validateOrderBody, validateDishes, validateUpdateInformation, update],
    deleteOrder: [orderExists, deleteOrder],
    list,
}
const router = require("express").Router();
const controller = require("./orders.controller");
const methodNotAllowed = require("../errors/methodNotAllowed");

// TODO: Implement the /orders routes needed to make the tests pass

//Route methods for the /orders/:orderId route
router
    .route("/:orderId")
    .get(controller.read)
    .put(controller.update)
    .delete(controller.deleteOrder)
    .all(methodNotAllowed)

//Route mthods for the /order route
router
    .route("/")
    .get(controller.list)
    .post(controller.create)
    .all(methodNotAllowed)


module.exports = router;

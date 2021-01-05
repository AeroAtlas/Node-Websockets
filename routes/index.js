const router = require("express").Router();
const feedRoutes = require("./feed");
const authRoutes = require("./auth");


router.use("/feed", feedRoutes);
router.use("/auth", authRoutes);


module.exports = router;


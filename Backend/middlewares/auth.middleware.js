const userModel = require('../models/user.models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const blacklistTokenModel = require('../models/blacklistToken.models');
const captainModel = require('../models/captain.models');

module.exports.authUser = async(req,res,next)=>{
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if(!token){
        return res.status(401).json({message: 'Unauthorized Access'});
    }

    const isBlacklisted = await blacklistTokenModel.findOne({ token : token });

    if(isBlacklisted){
        return res.status(401).json({ message: 'Unauthorized Access' });
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded._id);

        if (!user) {
            return res.status(401).json({message: 'Unauthorized Access'});
        }

        req.user = user;

        return next();

    }catch(err){
        return res.status(401).json({message: 'Unauthorized Access'});
    }
}

module.exports.authCaptain = async(req,res,next)=>{
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if(!token){
        return res.status(401).json({message: 'Unauthorized Access'});
    }

    const isBlacklisted = await blacklistTokenModel.findOne({ token : token });

    if(isBlacklisted){
        return res.status(401).json({ message: 'Unauthorized Access' });
    }

    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        const captain = await captainModel.findById(decoded._id);

        if (!captain) {
            return res.status(401).json({message: 'Unauthorized Access'});
        }

        req.captain = captain;

        return next();
        
    }catch(err){
       return res.status(401).json({message: 'Unauthorized Access'}); 
    }
}

module.exports.authAny = async(req,res,next)=>{
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if(!token){
        return res.status(401).json({message: 'Unauthorized Access'});
    }

    const isBlacklisted = await blacklistTokenModel.findOne({ token : token });

    if(isBlacklisted){
        return res.status(401).json({ message: 'Unauthorized Access' });
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded._id);
        if(user){
            req.user = user;
            return next();
        }

        const captain = await captainModel.findById(decoded._id);
        if(captain){
            req.captain = captain;
            return next();
        }

        return res.status(401).json({message: 'Unauthorized Access'});

    }catch(err){
        return res.status(401).json({message: 'Unauthorized Access'});
    }
}

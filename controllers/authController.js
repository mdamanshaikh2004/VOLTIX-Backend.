const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { isValidEmail, isStrongPassword, isNonEmptyString } = require('../utils/validation');
const { sendPasswordResetEmail, sendEmailVerificationEmail } = require('../services/emailService');

const clientUrl = () => String(process.env.CLIENT_URL || '').replace(/\/$/, '');
const minutes = (name, fallback) => { const value = Number(process.env[name]); return Number.isFinite(value) && value > 0 ? value : fallback; };
const OTP_TTL_MS = minutes('EMAIL_OTP_TTL_MINUTES', 10) * 60 * 1000;
const VERIFY_TTL_MS = minutes('EMAIL_VERIFICATION_TTL_MINUTES', 15) * 60 * 1000;
const RESET_SESSION_TTL_MS = 15 * 60 * 1000;
const OTP_ATTEMPT_LIMIT = 5;

const makeOtp = () => String(crypto.randomInt(100000, 1000000));
const hashValue = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const safeEqualHash = (a, b) => {
  if (!a || !b || typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); } catch { return false; }
};
const sanitizeUser = (user) => ({
  id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role,
  dateOfBirth: user.dateOfBirth, gender: user.gender || 'prefer-not-to-say', genderOther: user.genderOther || '',
  interestedCategories: user.interestedCategories || [], preferredBrands: user.preferredBrands || [],
  budgetRange: user.budgetRange || '', preferredDeviceTypes: user.preferredDeviceTypes || [], phone: user.phone || '',
  marketingOptIn: !!user.marketingOptIn, termsAccepted: !!user.termsAccepted,
  emailVerified: user.emailVerified !== false, createdAt: user.createdAt,
});

const validateDob = (value) => {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime()) || d > new Date()) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const beforeBirthday = today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 13 && age <= 120 ? d : null;
};

const buildVerification = () => {
  const otp = makeOtp();
  const rawToken = crypto.randomBytes(32).toString('hex');
  return { otp, otpHash: hashValue(otp), rawToken, tokenHash: hashValue(rawToken) };
};

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, dateOfBirth, gender = 'prefer-not-to-say', genderOther = '', interestedCategories = [], preferredBrands = [], budgetRange = '', preferredDeviceTypes = [], phone = '', marketingOptIn = false, termsAccepted = false } = req.body;
    const normalizedFirstName = typeof firstName === 'string' ? firstName.trim() : '';
    const normalizedLastName = typeof lastName === 'string' ? lastName.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (![normalizedFirstName, normalizedLastName, normalizedEmail, password, confirmPassword].every(isNonEmptyString)) return res.status(400).json({ success:false, message:'First name, last name, email and password are required' });
    if (normalizedFirstName.length > 60 || normalizedLastName.length > 60) return res.status(400).json({ success:false, message:'Name must be 60 characters or fewer' });
    if (!isValidEmail(normalizedEmail)) return res.status(400).json({ success:false, message:'Please provide a valid email' });
    if (password.length > 128) return res.status(400).json({ success:false, message:'Password must be 128 characters or fewer' });
    if (password !== confirmPassword) return res.status(400).json({ success:false, message:'Passwords do not match' });
    if (!isStrongPassword(password)) return res.status(400).json({ success:false, message:'Password must include upper/lowercase letters, a number and a special character' });
    if (!termsAccepted) return res.status(400).json({ success:false, message:'Please accept the Terms & Conditions and Privacy Policy.' });
    const validGenders = ['male','female','non-binary','prefer-not-to-say','other'];
    if (!validGenders.includes(gender)) return res.status(400).json({ success:false, message:'Please select a valid gender option.' });
    const dob = validateDob(dateOfBirth);
    if (dateOfBirth && !dob) return res.status(400).json({ success:false, message:'Date of birth must be valid and you must be at least 13 years old.' });
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ success:false, code: existing.emailVerified === false ? 'EMAIL_NOT_VERIFIED' : 'EMAIL_EXISTS', email: existing.email, message: existing.emailVerified === false ? 'An account already exists but still needs email verification. Request a new code.' : 'An account with this email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verification = buildVerification();
    const user = await User.create({ firstName:normalizedFirstName, lastName:normalizedLastName, email:normalizedEmail, password:hashedPassword, dateOfBirth:dob, gender, genderOther:gender === 'other' ? String(genderOther || '').trim().slice(0,60) : '', interestedCategories:Array.isArray(interestedCategories)?interestedCategories.slice(0,10):[], preferredBrands:Array.isArray(preferredBrands)?preferredBrands.slice(0,15):[], budgetRange:typeof budgetRange==='string'?budgetRange:'', preferredDeviceTypes:Array.isArray(preferredDeviceTypes)?preferredDeviceTypes.slice(0,10):[], phone:typeof phone==='string'?phone.trim().slice(0,25):'', marketingOptIn:Boolean(marketingOptIn), termsAccepted:true, emailVerified:false, emailVerificationToken:verification.tokenHash, emailVerificationExpires:Date.now()+VERIFY_TTL_MS, emailVerificationOtpHash:verification.otpHash, emailVerificationOtpExpires:Date.now()+VERIFY_TTL_MS, emailVerificationOtpAttempts:0 });
    try {
      await sendEmailVerificationEmail(user.email, `${clientUrl()}/verify-email/${verification.rawToken}`, verification.otp);
    } catch (emailErr) {
      await User.deleteOne({ _id:user._id });
      return res.status(emailErr.statusCode || 503).json({ success:false, code:emailErr.code || 'EMAIL_SEND_FAILED', message:'We could not send the verification email. Please check the email service configuration and try again.' });
    }
    res.status(201).json({ success:true, message:'Account created. Enter the verification code sent to your email.', email:user.email });
  } catch (err) { next(err); }
};

const login = async (req,res,next) => {
  try {
    const email=typeof req.body?.email==='string'?req.body.email.trim().toLowerCase():''; const password=req.body?.password;
    if(!isNonEmptyString(email)||!isNonEmptyString(password)) return res.status(400).json({success:false,message:'Email and password are required'});
    const user=await User.findOne({email}).select('+password'); if(!user) return res.status(401).json({success:false,message:'Invalid email or password'});
    if(!await bcrypt.compare(password,user.password)) return res.status(401).json({success:false,message:'Invalid email or password'});
    if(user.emailVerified===false) return res.status(403).json({success:false,code:'EMAIL_NOT_VERIFIED',email:user.email,message:'Please verify your email address before signing in.'});
    const token=generateToken(user._id); res.status(200).json({success:true,token,user:sanitizeUser(user)});
  } catch(err){next(err);}
};

const getMe = async (req,res,next)=>{try{res.status(200).json({success:true,user:sanitizeUser(req.user)});}catch(err){next(err);}};

const verifyEmail = async (req,res,next) => {
  try {
    const { token, email, otp } = req.body || {};
    let user;
    if (isNonEmptyString(token)) {
      const hashed=hashValue(token);
      user=await User.findOne({emailVerificationToken:hashed,emailVerificationExpires:{$gt:Date.now()}}).select('+emailVerificationToken +emailVerificationExpires +emailVerificationOtpHash +emailVerificationOtpExpires +emailVerificationOtpAttempts');
    } else {
      const normalized=typeof email==='string'?email.trim().toLowerCase():'';
      if(!isValidEmail(normalized)||!/^\d{6}$/.test(String(otp||''))) return res.status(400).json({success:false,message:'Enter the email address and 6-digit verification code.'});
      user=await User.findOne({email:normalized}).select('+emailVerificationOtpHash +emailVerificationOtpExpires +emailVerificationOtpAttempts');
      if(!user || user.emailVerified===true) return res.status(400).json({success:false,message:'This verification code is invalid or the account is already verified.'});
      if((user.emailVerificationOtpAttempts||0)>=OTP_ATTEMPT_LIMIT) return res.status(429).json({success:false,message:'Too many incorrect codes. Request a new verification code.'});
      if(!user.emailVerificationOtpExpires || user.emailVerificationOtpExpires<=Date.now()) return res.status(400).json({success:false,message:'Verification code has expired. Request a new code.'});
      user.emailVerificationOtpAttempts=(user.emailVerificationOtpAttempts||0)+1;
      if(!safeEqualHash(user.emailVerificationOtpHash,hashValue(otp))) { await user.save(); return res.status(400).json({success:false,message:'Incorrect verification code.'}); }
    }
    if(!user) return res.status(400).json({success:false,message:'Verification code or link is invalid or has expired. Request a new verification code.'});
    user.emailVerified=true; user.emailVerificationToken=undefined; user.emailVerificationExpires=undefined; user.emailVerificationOtpHash=undefined; user.emailVerificationOtpExpires=undefined; user.emailVerificationOtpAttempts=0; await user.save();
    res.status(200).json({success:true,message:'Email verified successfully. You can now sign in.'});
  } catch(err){next(err);}
};

const resendVerification = async (req,res,next) => {
  try {
    const normalized=typeof req.body?.email==='string'?req.body.email.trim().toLowerCase():'';
    if(!isValidEmail(normalized)) return res.status(400).json({success:false,message:'Please provide a valid email'});
    const generic={success:true,message:'If the account exists and still needs verification, a new verification code has been sent.'};
    const user=await User.findOne({email:normalized}); if(!user||user.emailVerified===true) return res.status(200).json(generic);
    const verification=buildVerification(); user.emailVerificationToken=verification.tokenHash; user.emailVerificationExpires=Date.now()+VERIFY_TTL_MS; user.emailVerificationOtpHash=verification.otpHash; user.emailVerificationOtpExpires=Date.now()+VERIFY_TTL_MS; user.emailVerificationOtpAttempts=0; await user.save();
    try{await sendEmailVerificationEmail(user.email,`${clientUrl()}/verify-email/${verification.rawToken}`,verification.otp);}catch(err){user.emailVerificationToken=undefined;user.emailVerificationExpires=undefined;user.emailVerificationOtpHash=undefined;user.emailVerificationOtpExpires=undefined;user.emailVerificationOtpAttempts=0;await user.save();return res.status(err.statusCode||503).json({success:false,code:err.code||'EMAIL_SEND_FAILED',message:'We could not send the verification code. Please check the email service configuration and try again.'});}
    res.status(200).json(generic);
  }catch(err){next(err);}
};

const forgotPassword = async (req,res,next) => {
  try {
    const email=typeof req.body?.email==='string'?req.body.email.trim().toLowerCase():'';
    if(!isValidEmail(email)) return res.status(400).json({success:false,message:'Please provide a valid email'});
    const generic={success:true,message:'If an account with that email exists, a password reset code has been sent.'};
    const user=await User.findOne({email}); if(!user) return res.status(200).json(generic);
    const otp=makeOtp(); user.resetPasswordOtpHash=hashValue(otp); user.resetPasswordOtpExpires=Date.now()+OTP_TTL_MS; user.resetPasswordOtpAttempts=0; user.resetPasswordToken=undefined; user.resetPasswordExpires=undefined; await user.save();
    try{await sendPasswordResetEmail(user.email,otp);}catch(err){user.resetPasswordOtpHash=undefined;user.resetPasswordOtpExpires=undefined;user.resetPasswordOtpAttempts=0;await user.save();return res.status(err.statusCode||503).json({success:false,code:err.code||'EMAIL_SEND_FAILED',message:'We could not send the password reset code. Please check the email service configuration and try again.'});}
    res.status(200).json(generic);
  }catch(err){next(err);}
};

const verifyResetOtp = async (req,res,next) => {
  try {
    const email=typeof req.body?.email==='string'?req.body.email.trim().toLowerCase():''; const otp=String(req.body?.otp||'');
    if(!isValidEmail(email)||!/^[0-9]{6}$/.test(otp)) return res.status(400).json({success:false,message:'Enter your email and the 6-digit reset code.'});
    const user=await User.findOne({email}).select('+resetPasswordOtpHash +resetPasswordOtpExpires +resetPasswordOtpAttempts');
    if(!user||!user.resetPasswordOtpHash) return res.status(400).json({success:false,message:'Reset code is invalid or has expired. Request a new code.'});
    if((user.resetPasswordOtpAttempts||0)>=OTP_ATTEMPT_LIMIT) return res.status(429).json({success:false,message:'Too many incorrect codes. Request a new reset code.'});
    if(user.resetPasswordOtpExpires<=Date.now()) return res.status(400).json({success:false,message:'Reset code has expired. Request a new code.'});
    user.resetPasswordOtpAttempts=(user.resetPasswordOtpAttempts||0)+1;
    if(!safeEqualHash(user.resetPasswordOtpHash,hashValue(otp))){await user.save();return res.status(400).json({success:false,message:'Incorrect reset code.'});}
    const resetToken=crypto.randomBytes(32).toString('hex'); user.resetPasswordToken=hashValue(resetToken); user.resetPasswordExpires=Date.now()+RESET_SESSION_TTL_MS; user.resetPasswordOtpHash=undefined; user.resetPasswordOtpExpires=undefined; user.resetPasswordOtpAttempts=0; await user.save();
    res.status(200).json({success:true,resetToken,message:'Code verified. You can now choose a new password.'});
  }catch(err){next(err);}
};

const resetPassword = async (req,res,next) => {
  try {
    const {token,password,confirmPassword}=req.body||{};
    if(!isNonEmptyString(token)||!isNonEmptyString(password)||!isNonEmptyString(confirmPassword)) return res.status(400).json({success:false,message:'All fields are required'});
    if(password!==confirmPassword) return res.status(400).json({success:false,message:'Passwords do not match'});
    if(!isStrongPassword(password)) return res.status(400).json({success:false,message:'Password must include 8+ characters, uppercase, lowercase, number and special character'});
    const hashed=hashValue(token); const user=await User.findOne({resetPasswordToken:hashed,resetPasswordExpires:{$gt:Date.now()}}).select('+resetPasswordToken +resetPasswordExpires');
    if(!user) return res.status(400).json({success:false,message:'Password reset session is invalid or expired. Request a new code.'});
    user.password=await bcrypt.hash(password,10); user.resetPasswordToken=undefined; user.resetPasswordExpires=undefined; user.resetPasswordOtpHash=undefined; user.resetPasswordOtpExpires=undefined; user.resetPasswordOtpAttempts=0; await user.save();
    res.status(200).json({success:true,message:'Password updated successfully. You can now log in.'});
  }catch(err){next(err);}
};

module.exports={register,login,getMe,verifyEmail,resendVerification,forgotPassword,verifyResetOtp,resetPassword};

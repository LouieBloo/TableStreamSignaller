import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IMongoUser } from '../../infrastructure/mongo/models/user-model';
import { apiError } from './services/router-error-service';
import { JwtPayload } from 'jsonwebtoken';

import {
  RegExpMatcher,
  TextCensor,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';
import { sendEmail } from '../../infrastructure/emails/email-service';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'replace_me';
const JWT_EXPIRES_IN = '12h';

// profanity matcher setup
const censor = new TextCensor();
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

// ------------------------------------------------------------------
//  Middleware to validate & sanitize input
// ------------------------------------------------------------------
const validate = (rules: any[]) => [
  ...rules,
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// ------------------------------------------------------------------
//  1) SIGNUP
// ------------------------------------------------------------------
router.post(
  '/signup',
  validate([
    body('name').isLength({ min: 3, max: 30 }),
    body('email').isEmail(),
    body('password').isLength({ min: 10, max: 100 }),
  ]),
  async (req: any, res: any) => {
    const { name, email, password } = req.body;

    // reject bad usernames
    if (matcher.getAllMatches(name).length > 0) {
      return res.status(400).json({
        errors: [apiError("Inappropriate Name Detected","name")]
      });
    }

    // duplicate email?
    if (await User.exists({ email })) {
      return res.status(409).json({
        errors: [apiError("Invalid Email","email")]
      });
    }

    // hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({ name, email, passwordHash });

    try{
      await sendEmail({
        email: email,
        name: name,
        subject: "Verify Email",
        templateId: '351ndgwk9wxgzqx8',
        data: {
          url: "https://www.google.com",
          name: name
        }
      })
    }catch(e){
      console.error(e);
      return res.status(400).json({ message: "User created but verification email failed to send" });
    }
    
    //send email
    res.status(201).json({ message: "ok" });
  }
);

// ------------------------------------------------------------------
//  2) LOGIN
// ------------------------------------------------------------------
router.post(
  '/login',
  validate([
    body('email').isEmail(),
    body('password').notEmpty(),
  ]),
  async (req: any, res: any) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        errors: [apiError("Invalid Credentials","password")]
      });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({
        errors: [apiError("Invalid Credentials","password")]
      });
    }
    const token = jwt.sign({ sub: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    res.json({ token });
  }
);

// ------------------------------------------------------------------
//  3) REQUEST PASSWORD RESET
// ------------------------------------------------------------------
router.post(
  '/request-password-reset',
  validate([body('email').isEmail()]),
  async (req: any, res: any) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'Reset link sent if email exists.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600_000); // 1h
    await user.save();

    // TODO: send email with link: `${process.env.FRONTEND_URL}/reset-password?token=${token}`
    // console.log(`RESET LINK: https://your.app/reset-password?token=${token}`);

    res.json({ message: 'Reset link sent if email exists.' });
  }
);

// ------------------------------------------------------------------
//  4) RESET PASSWORD
// ------------------------------------------------------------------
router.post(
  '/reset-password',
  validate([
    body('token').notEmpty(),
    body('password').isLength({ min: 10, max: 100 }),
  ]),
  async (req: any, res: any) => {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({
        errors: [apiError("Invalid or Expired Token","token")]
      });
    }
    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successfully.' });
  }
);

router.get('/validate', authenticateToken, (req:any, res:any)=>{
  return res.json({message: "you are logged in"})
})

// ------------------------------------------------------------------
//  5) JWT Validator Middleware
// ------------------------------------------------------------------
export function authenticateToken(
  req: any & { user?: IMongoUser },
  res: any,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({
      errors: [apiError("you are not allowed to do that","token")]
    });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = { _id: payload.sub } as any; // minimal
    return next();
  } catch {
    return res.status(401).json({
      errors: [apiError("you are not allowed to do that","token")]
    });
  }
}

export default router;

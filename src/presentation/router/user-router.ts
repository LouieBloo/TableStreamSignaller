import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IMongoUser } from '../../infrastructure/mongo/models/user-model';
import { apiError } from './services/router-error-service';
import { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../../domain/users/services/user-service';
import { sendEmail } from '../../infrastructure/emails/email-service';
import { trimUser, updateUser, validName } from '../../infrastructure/mongo/services/user-service';
import { IAPIError } from './interfaces/IAPIError';
import MongoReport, { IMongoReport } from '../../infrastructure/mongo/models/report-model';
import mongoose from 'mongoose';
import { Room } from '../../domain/rooms/room';
import { getRoomUnsafe } from '../../infrastructure/redis/redis';
import { IMongoRoom } from '../../infrastructure/mongo/models/room-model';
import RoomManager from "../../services/room-manager";
import { getRoomByTableStreamId } from '../../infrastructure/mongo/mongo-repository';

const { v4: uuidv4 } = require('uuid');

const router = Router();


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
// SIGNUP
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
    if (!validName(name)) {
      return res.status(400).json({
        errors: [apiError("Inappropriate Name Detected", "name")]
      });
    }

    // duplicate email?
    if (await User.exists({ email })) {
      return res.status(409).json({
        errors: [apiError("Invalid Email", "email")]
      });
    }

    // hash password
    const passwordHash = await bcrypt.hash(password, 12);

    //verify email token
    const verifiyEmailToken: string = uuidv4();

    const user = await User.create({ name, email, passwordHash, verifiyEmailToken });

    try {
      await sendEmail({
        email: email,
        name: name,
        subject: "Verify Email",
        templateId: '351ndgwk9wxgzqx8',
        data: {
          url: process.env.APP_URL + "/verify-email?token=" + verifiyEmailToken,
          name: name
        }
      })
    } catch (e) {
      console.error(e);
      return res.status(400).json({ message: "User created but verification email failed to send" });
    }

    //send email
    res.status(201).json({ message: "ok" });
  }
);

// ------------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------------
router.post(
  '/login',
  validate([
    body('email').isEmail(),
    body('password').notEmpty(),
  ]),
  async (req: any, res: any) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, verifiedEmail: true });
    if (!user) {
      return res.status(401).json({
        errors: [apiError("Invalid Credentials", "password")]
      });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({
        errors: [apiError("Invalid Credentials", "password")]
      });
    }
    const token = jwt.sign({ sub: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    res.json({ token });
  }
);

// ------------------------------------------------------------------
// REQUEST PASSWORD RESET
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
    const token = uuidv4();
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600_000); // 1h
    await user.save();

    // TODO: send email with link: `${process.env.FRONTEND_URL}/reset-password?token=${token}`
    // console.log(`RESET LINK: https://your.app/reset-password?token=${token}`);
    await sendEmail({
      email: email,
      name: "Reset Password",
      subject: "Reset Password",
      templateId: 'yzkq340nmpkgd796',
      data: {
        url: process.env.APP_URL + "/reset-password?token=" + token,
        name: "Reset Password"
      }
    })

    res.json({ message: 'Reset link sent if email exists.' });
  }
);

// ------------------------------------------------------------------
// RESET PASSWORD
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
        errors: [apiError("Invalid or Expired Token", "token")]
      });
    }
    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successfully.' });
  }
);

// ------------------------------------------------------------------
//  Verify Email
// ------------------------------------------------------------------
router.post('/verify-email', validate([
  body('token').notEmpty(),
]),
  async (req: any, res: any) => {
    const { token } = req.body;
    const user = await User.findOne({
      verifiyEmailToken: token,
    });
    if (!user) {
      return res.status(400).json({
        errors: [apiError("Invalid or Expired Token", "token")]
      });
    }
    user.verifiedEmail = true;
    await user.save();
    res.json({ message: 'Email verified successfully' });
  })


router.get('/me', authenticateToken, async (req: any, res: any) => {
  const user: IMongoUser = await User.findById(req.user._id);
  return res.json({ user: trimUser(user) })
})

// ------------------------------------------------------------------
// Update User
// ------------------------------------------------------------------
router.post('/', authenticateToken, validate([body('name').isLength({ min: 3, max: 30 }),]), async (req: any, res: any) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.sendStatus(404);

  // const updates:U = {
  //   name: req.body.name,
  // };

  const errors = await updateUser(user, req.body);

  if (errors.length) {
    return res.status(400).json({ errors });
  }

  return res.json({ user: trimUser(user) });
})

// ------------------------------------------------------------------
// Report User
// ------------------------------------------------------------------
router.post('/reports', authenticateToken, [
  body('offenderPlayerId').isMongoId().withMessage('offenderPlayerId must be a valid ObjectId'),
  body('reason')
    .isIn(['GRIEFING', 'CAMERA_ABUSE', 'AUDIO_ABUSE', 'HARASSMENT', 'CHAT_ABUSE', 'OTHER'])
    .withMessage('Invalid reason'),
  body('roomId').isString().withMessage('roomId required'),
  body('notes').optional().isString().withMessage('notes must be a string'),
], async (req: any, res: any) => {
  try {
    const {
      offenderPlayerId,
      reason,
      notes,
      roomId,
    } = req.body;

    //find rooms
    const redisRoom: Room = await RoomManager.getRoomUnsafe(roomId);

    //verify both these players are in the room
    const reporterIndex = redisRoom.players.findIndex(
      (p) => p.mongoUserId.toString() === req.user._id //note we look at mongo user id
    );

    const offenderPlayer = redisRoom.players.find(
      (p) => p.id === offenderPlayerId // note we look at normal room player id, not mongo id as the front end doesnt know the real mongo user ids
    );

    const offendingPlayerMongoId = offenderPlayer.mongoUserId;

    // Validate
    if (reporterIndex === -1 || !offendingPlayerMongoId) {
      return res.status(400).json({
        errors: [apiError("Invalid report, players not found", "offenderUserId")]
      });
    }

    const mongoRoom:IMongoRoom = await getRoomByTableStreamId(roomId);

    // Create the new report
    const newReport: Partial<IMongoReport> = {
      reporterUserId: new mongoose.Types.ObjectId(req.user._id), // assuming req.user.id is the ObjectId of the authenticated user
      offenderUserId: new mongoose.Types.ObjectId(offendingPlayerMongoId),
      reason,
      notes,
      roomId: new mongoose.Types.ObjectId(mongoRoom._id),
      messages: redisRoom.messages
    };

    const savedReport = await MongoReport.create(newReport);

    res.status(201).json({
      message: 'Report created successfully',
    });
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(500).json({
      errors: [apiError(err, "general")]
    });
  }
});


// ------------------------------------------------------------------
// JWT Validator Middleware
// ------------------------------------------------------------------
export function authenticateToken(
  req: any & { user?: IMongoUser },
  res: any,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({
      errors: [apiError("you are not allowed to do that", "token")]
    });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = { _id: payload.sub } as any; // minimal
    return next();
  } catch {
    return res.status(401).json({
      errors: [apiError("you are not allowed to do that", "token")]
    });
  }
}

export default router;

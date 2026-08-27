import { Router, type IRouter } from "express";

const HELPLINE_DIRECTORY = [
  { name: "Police Emergency", number: "112 / 100", authority: "Local Police", tags: "emergency, safety, police" },
  { name: "Ambulance & Medical", number: "102 / 108", authority: "State Health Dept", tags: "medical, hospital, ambulance" },
  { name: "Mental Health Helpline (KIRAN)", number: "1800-599-0019", authority: "Min. of Social Justice", tags: "mental health, counseling, aid" },
  { name: "National Disability Helpline", number: "011-23386128", authority: "Dept of Empowerment of PwD", tags: "disability, query, guidance" },
  { name: "Senior Citizens National Helpline", number: "14567", authority: "Min. of Social Justice", tags: "elderly, senior citizens, vrudhashram" },
  { name: "Women Helpline", number: "1091", authority: "National Commission for Women", tags: "women, emergency, safety" },
];

const router: IRouter = Router();

router.get("/helplines", (_req, res): void => {
  res.json(HELPLINE_DIRECTORY);
});

export default router;

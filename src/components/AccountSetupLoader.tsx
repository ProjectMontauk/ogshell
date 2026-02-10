import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { tokenContract } from "../../constants/contracts";
import { parseAmountToWei } from "../utils/parseAmountToWei";
import { useState, useEffect, useRef } from "react";
import DenariusSymbol from "./DenariusSymbol";

export default function AccountSetupLoader() {
  // Auto-mint / auto-deposit temporarily disabled
  // We keep this component as a no-op so it can be re-enabled later if needed.
  return null;
} 
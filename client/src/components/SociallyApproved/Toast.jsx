import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectToast, toastDismissed } from '../../store/uiSlice';
import './Toast.css';


export default function Toast() {
  const dispatch = useDispatch();
  const toast = useSelector(selectToast);
  const toastId = toast?.id;

  useEffect(() => {
    if (!toastId) return undefined;
    const timer = window.setTimeout(() => dispatch(toastDismissed()), 3200);
    return () => window.clearTimeout(timer);
  }, [dispatch, toastId]);

  if (!toast) return null;

  return (
    <div className={`sa-toast sa-toast--${toast.tone}`} role="status" aria-live="polite">
      {toast.message}
    </div>
  );
}

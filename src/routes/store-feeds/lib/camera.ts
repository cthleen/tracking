export async function connectToCamera(
  cameraId: number,
  videoElement: HTMLVideoElement,
  onStatusChange?: (status: 'Active' | 'Offline') => void
) {
  const pc = new RTCPeerConnection();

  pc.addTransceiver('video', { direction: 'recvonly' });

  pc.ontrack = (event) => {
    videoElement.srcObject = event.streams[0];
    onStatusChange?.('Active');
  };

  pc.onconnectionstatechange = () => {
    const state = pc.connectionState;

    if (
      state === 'failed' ||
      state === 'disconnected' ||
      state === 'closed'
    ) {
      onStatusChange?.('Offline');
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const response = await fetch(
    `http://localhost:9876/offer?camera_id=${cameraId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pc.localDescription),
    }
  );

  const answer = await response.json();
  await pc.setRemoteDescription(answer);

  return pc;
}

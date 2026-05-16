<?php

namespace App\Events;

use App\Models\UjianPeserta;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ParticipantStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $peserta;

    public function __construct(UjianPeserta $peserta)
    {
        $this->peserta = $peserta->load('student');
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('monitoring.' . $this->peserta->sesi_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'status.changed';
    }
}

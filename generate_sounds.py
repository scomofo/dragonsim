"""Generate all Dragon Forge sound effects as WAV files using synthesis."""
import struct, math, random, os

OUT = "app/public/audio"
os.makedirs(OUT, exist_ok=True)
SR = 22050

def write_wav(name, samples):
    path = os.path.join(OUT, name)
    data = b''.join(struct.pack('<h', max(-32768, min(32767, int(s * 32767)))) for s in samples)
    with open(path, 'wb') as f:
        f.write(b'RIFF')
        f.write(struct.pack('<I', 36 + len(data)))
        f.write(b'WAVEfmt ')
        f.write(struct.pack('<IHHIIHH', 16, 1, 1, SR, SR*2, 2, 16))
        f.write(b'data')
        f.write(struct.pack('<I', len(data)))
        f.write(data)
    print(f"  {name}: {len(samples)/SR:.2f}s")

def sin(f, t): return math.sin(2*math.pi*f*t)
def sqr(f, t): return 1.0 if sin(f, t) > 0 else -1.0
def saw(f, t): return 2.0*(f*t % 1.0)-1.0
def nz(): return random.uniform(-1, 1)
def decay(t, dur, atk=0.01): return min(1, t/atk) if t < atk else max(0, 1-(t-atk)/(dur-atk))

def gen(dur, fn):
    return [fn(i/SR, dur) for i in range(int(SR*dur))]

# 1. BOOT - resonant synth rise with chirp
write_wav("sys_boot_resonant.wav", gen(1.5, lambda t, d:
    (sin(80+720*(t/d)**2, t)*0.4 + sin((80+720*(t/d)**2)*1.005, t)*0.3 +
     sin((80+720*(t/d)**2)*2, t)*0.15 +
     (sin(2000+1000*((t-(d-0.15))/0.15), t)*0.3*(1-(t-(d-0.15))/0.15) if t > d-0.15 else 0)
    ) * decay(t, d, 0.05) * 0.7))

# 2. TEXT BLIP - short click
write_wav("sys_text_blip.wav", gen(0.04, lambda t, d:
    (sqr(1200, t)*0.3 + sin(2400, t)*0.2) * decay(t, d, 0.002) * 0.5))

# 3. UI CONFIRM - sine ping with delay
write_wav("ui_select_ping.wav", gen(0.3, lambda t, d:
    ((sin(880,t)*0.5+sin(1320,t)*0.3+sin(1760,t)*0.15)*decay(t,d,0.005) +
     (sin(880,t-0.08)*0.15*decay(t-0.08,d-0.08,0.005) if t>0.08 else 0)
    ) * 0.6))

# 4. UI ERROR - bit-crushed buzz
write_wav("ui_denied_buzz.wav", gen(0.25, lambda t, d:
    round((sqr(120,t)*0.4+sqr(90,t)*0.3+nz()*0.15)*4)/4 * decay(t,d,0.005) * 0.5))

# 5. HATCH START - oscillating hum (speeding up)
write_wav("hatch_molecular_hum.wav", gen(2.0, lambda t, d: (
    lambda mod: (sin(200+100*mod, t)*0.4+sin((200+100*mod)*1.5, t)*0.2) * decay(t,d,0.1) * mod * 0.5
)(0.5+0.5*sin(2*math.pi*(4+12*(t/d))*t, 0))))

# 6. HATCH SUCCESS - sparkle chime arpeggio
def hatch_chime(t, d):
    s = 0
    for j, f in enumerate([523, 659, 784, 1047]):
        onset = j*0.06
        if t >= onset:
            s += sin(f, t-onset)*0.25*decay(t-onset, d-onset, 0.005)
    s += sin(3000+500*math.sin(30*t), t)*0.1*decay(t, d, 0.01)
    return s*0.7
write_wav("hatch_complete_chime.wav", gen(0.8, hatch_chime))

# 7. SHINY ALERT - metallic shimmer
write_wav("hatch_shiny_sting.wav", gen(1.0, lambda t, d:
    (sin(2500,t)*0.3+sin(3750,t)*0.2+sin(5000,t)*0.15+sin(2777,t)*0.1+sin(4133,t)*0.08
    ) * decay(t,d,0.003) * 0.5))

# 8. EVOLUTION - deep rumble + grinding rise
def evolve(t, d):
    s = sin(40,t)*0.4 + sin(60,t)*0.3
    s += saw(150+50*math.sin(3*t), t)*0.15*(0.5+0.5*math.sin(8*t))
    s += sin(200+400*(t/d), t)*0.2*(t/d)
    return s * decay(t, d, 0.2) * 0.6
write_wav("forge_energy_surge.wav", gen(2.0, evolve))

# 9. FIRE ATTACK - woosh + crackle
def fire_atk(t, d):
    s = nz()*0.4*decay(t, 0.15, 0.02)
    if t > 0.1: s += nz()*0.2*decay(t-0.1, d-0.1, 0.01)
    s += sin(150, t)*0.2*decay(t, 0.2, 0.01)
    return s*0.7
write_wav("atk_fire_slash.wav", gen(0.5, fire_atk))

# 10. LIGHTNING - zap with distortion
write_wav("atk_static_discharge.wav", gen(0.3, lambda t, d:
    max(-0.8, min(0.8, (sqr(3000-2500*(t/d), t)*0.3+nz()*0.2)*2)) * decay(t,d,0.002) * 0.6))

# 11. ICE - crack + glass tinkle
def ice_atk(t, d):
    s = nz()*0.6*decay(t, 0.03, 0.001)
    if t > 0.03:
        tt = t-0.03
        for f in [4000, 5200, 6800]:
            s += sin(f, tt)*0.12*decay(tt, d-0.03, 0.005)
    return s*0.6
write_wav("atk_glacier_crack.wav", gen(0.4, ice_atk))

# 12. CRITICAL HIT - heavy thud
write_wav("hit_crit_thud.wav", gen(0.35, lambda t, d:
    (sin(80*math.exp(-3*t), t)*0.6 + nz()*0.15*decay(t, 0.05, 0.001)) * decay(t,d,0.003) * 0.8))

# 13. NPC DEATH - power-down pitch slide
def npc_death(t, d):
    freq = 800*math.exp(-4*t)+50
    s = sqr(freq, t)*0.3 + saw(freq*0.5, t)*0.2
    if t > 0.4: s += nz()*0.3*((t-0.4)/0.3)
    s = round(s*6)/6
    return s*decay(t, d, 0.01)*0.5
write_wav("mob_decompile.wav", gen(0.7, npc_death))

# 14. BOSS ROAR - corrupted granular
def boss_roar(t, d):
    s = saw(60+20*math.sin(2*t), t)*0.4 + sqr(90+30*math.sin(3*t), t)*0.3
    s *= 0.5+0.5*(nz()*0.3+0.7)
    s = round(s*3)/3
    return s*decay(t, d, 0.1)*0.6
write_wav("boss_void_glitch.wav", gen(1.5, boss_roar))

# 15. BOSS HEARTBEAT - sub-bass pulse
def heartbeat(t, d):
    phase = (t*1.2) % 1.0
    if phase < 0.08: s = sin(50, t)*0.6*(1-phase/0.08)
    elif 0.15 < phase < 0.22: s = sin(40, t)*0.4*(1-(phase-0.15)/0.07)
    else: s = 0
    return (s + sin(30, t)*0.1) * 0.7
write_wav("boss_low_heartbeat.wav", gen(2.0, heartbeat))

# 16. ULTRA SHINY - digital scream, silence, boom
def quantum_break(t, d):
    if t < 0.8:
        s = nz()*0.4*(1+t) + saw(200+2000*t, t)*0.3
        s = round(s*2)/2
        return s*decay(t, 0.8, 0.05)*0.7
    elif t < 1.2: return 0
    else:
        tt = t-1.2
        return (sin(60*math.exp(-2*tt), tt)*0.7 + nz()*0.2*decay(tt, 0.3, 0.01)) * decay(tt, 0.8, 0.01) * 0.7
write_wav("forge_quantum_break.wav", gen(2.0, quantum_break))

print("\nAll 16 sound effects generated!")

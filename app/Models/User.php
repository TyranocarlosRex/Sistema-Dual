<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Student;
use App\Models\Coordinator;
use App\Models\Admin;

/*Clase: User
Descripción: Modelo que representa a un usuario en la aplicación, que puede ser un estudiante, coordinador o administrador.
Atributos:
- name: Nombre del usuario.
- email: Correo electrónico del usuario.
- password: Contraseña del usuario.
- role: Rol del usuario (e.g., 'student', 'coordinator', 'admin').
Relaciones:
- student(): Relación de uno a uno con el modelo Student, indicando que un usuario 
puede tener un registro asociado en la tabla student, 
que contiene información adicional sobre su estatus como estudiante.
- coordinator(): Relación de uno a uno con el modelo Coordinator, indicando que un 
usuario puede tener un registro asociado en la tabla coordinators, que contiene información 
adicional sobre su estatus como coordinador.
- admin(): Relación de uno a uno con el modelo Admin, indicando que un usuario puede tener 
un registro asociado en la tabla admins, que contiene información adicional sobre su estatus 
como administrador.
*/   
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    

    public function student()
    {
        return $this->hasOne(Student::class, 'user_id');
    }

    public function coordinator()
    {
        return $this->hasOne(Coordinator::class, 'user_id');
    }

    public function admin()
    {
        return $this->hasOne(Admin::class, 'user_id');
    }
}
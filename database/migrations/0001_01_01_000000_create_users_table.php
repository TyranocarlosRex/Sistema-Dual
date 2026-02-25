<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
/*Esta migración crea tres tablas en la base de datos: 'users', 'password_reset_tokens' y 'sessions'.
La tabla 'users' almacena información sobre los usuarios, incluyendo su nombre, correo electrónico, fecha de verificación del correo electrónico, contraseña, token de recuerdo y rol. 
La tabla 'password_reset_tokens' almacena los tokens de restablecimiento de contraseña para los usuarios, con su correo electrónico como clave primaria. 
La tabla 'sessions' almacena información sobre las sesiones de los usuarios, incluyendo el ID de la sesión, el ID del usuario, la dirección IP, el agente de usuario, la carga útil y la última actividad. 
La función 'up' se encarga de crear estas tablas, mientras que la función 'down' se encarga de eliminarlas si es necesario.*/       
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
            $table->enum('role', ['coordinator', 'student', 'admin']);
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};